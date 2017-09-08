# Auth0 hosted log in for Ionic
This is an Ionic Starter Project for Auth0. This project includes services and pages for using a the hosted lock screen for Ionic with Auth0.

Requests to api are made with Authorization header using Bearer prefix and the Auth0 idToken. To be OIDC conformant, request should instead use the access_token and let the server request and idToken. 

Supported functions:

### Log in
- Validate user
- Return user info

### Sign up
- Email confirmation, redirect to lock screen

### Reset password
- Email confirmation, redirect to lock screen

### Sign out
- Email confirmation, redirect to lock screen

### Token refresh

Versions
Auth0: 8.8.0
Ionic: 3.6
Angular: 4.1.3


## How this was built

The hosted login page from Auth0 relies on redirecting the user from your app to the login page and back again. We'll use ionic storage for storing the tokens. This needs a little work since Auth0 defaults to using localStorage. 

### install libraries

Install the auth0.js library
`npm install --save auth0-js`

### Create authentication service

Use ionic-cli's provider (service) generator to create the service

`ionic g provider AuthenticationService`

Import the AuthenticationService into the app.module.ts with an import statement, and in the providers array.

In the providers/authentication-serviceauthentication-service.ts file, add this:

```javascript
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import * as auth0 from 'auth0-js';

@Injectable()
export class AuthenticationService {

  auth0 = new auth0.WebAuth({
    clientID: 'yourclientid',
    domain: 'yourdomain.eu.auth0.com',
    responseType: 'token id_token',
    audience: 'https://yourdomain.eu.auth0.com/userinfo',
    redirectUri: 'http://localhost:4200',
    scope: 'openid'
  });

  constructor() { }

  public login(): void {
    this.auth0.authorize();
  }

}
```

For now, it has a single function called login which opens the Auth0 hosted login page. After a successful login we want Auth0 to redirect us back to our app. We set this in the redirectUri variable when we instantiate the webAuth interface. 

Auth0 appends /#access_token... to the redirectUri. This is used to parse the user's tokens. Unfortunately, Ionics deep linking also relies on this hash. The url to, say, the home page is localhost:63021/#/home. This means we cannot let Auth0 redirect to a specific page in our app because everything after the last forward slash gets replaced. Instead we must configure our routing from inside the app.

If you run the application with `ionic serve` you should see a loader and immediately be redirected to Auth0 login. This continues in and endless loop (or until Auth0 blocks you). We shall change that.


In our authentication service we will add some more functions.

What we want is for the app to go too our root page if we have a valid token. If not, it should redirect to the login. On the root page we should also be able to log out.

First we will wrap out login function in a promise. We'll do that because we want to wait for it to finish before we let the sign in process continue:

```javascript
  public login(): Promise<any> {
    return new Promise((resolve, reject) => {
    this.auth0.authorize();
    resolve('Redirected');
    })
  }
```

Then we will need a function to grab and parse the token that is appendended to the app's root url.

```javascript
  public grabAndParseToken(): Promise<any> {

    return new Promise((resolve, reject) => {
      this.auth0.parseHash({ _idTokenVerification: false },(err, authResult) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
          window.location.hash = '';
          console.log('This is the location when setSession is called: ',window.location);
          this.setSession(authResult).then(() => resolve(true));
        } else if (err) {
          reject(err);
        }
      });
    });
  }
```

We have set the option  `_idTokenVerification: false`. This means we will not check the idToken is valid. It is chosen only because the Safari browser did not play nice with it. If you are using the id_token for any type of authentication you should definately make sure to validate it in some way. Since we are only using the accessToken for authentication we have no problem.

The token needs to be stored. For this we have yet another function:

```javascript
  private setSession(authResult): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set the time that the access token will expire at
      const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
      this.storage.ready().then(() => this.storage.set('access_token', authResult.accessToken))
        .then(() => { return this.storage.set('id_token', authResult.idToken); })
        .then(() => { return this.storage.set('expires_at', expiresAt) })
        .then(() => { return this.storage.get('expires_at') })
        .then((result => console.log('This was stored by setSession', result)))
        .then(() => resolve('Authorized successfully'))
        .catch(error => {
          console.log(error);
        })
    })
  }
```

To wrab it all up, we have this:

```javascript
  public checkAuthentication(): Promise<any> {
    return new Promise((resolve, reject) => {

      this.storage.ready().then(() => this.storage.get('expires_at'))
        .then((result) => {console.log('Storage ready!'); return result})
        .then((result) => {
          console.log(window.location);
          console.log('This was in storage: ',result);
          // Check whether the current time is past the
          // access token's expiry time
          if (new Date().getTime() < JSON.parse(result)) {
            console.log('Not expired: Authenticated');
            this.isAuthenticated = true;
            resolve();
          }
          else {
            // Else redirect to login
            console.log('Expired: Not authenticated!');
            this.login()
              .then(() => { return this.grabAndParseToken() })          
              .then((authenticationStatus) => {
                if (authenticationStatus) {
                  console.log('Successfully authenticated!', authenticationStatus);
                  this.isAuthenticated = true;
                  resolve();
                }
                else {
                  console.log('Failed authentication!', authenticationStatus);
                  this.isAuthenticated = false;
                  reject(authenticationStatus);
                }
              })
          }
        })
    })

  }
  ```

  It gets the value at the key 'expires_at' which is our stored accessToken's expiration time. If this is later than the current time (unix epoch) we conclude that we are autheticated and set the variable `isAuthenticated = true`. If not, we will use login(), grabAndParseToken(), and setSession() to get and set a new valid accessToken.

  Whenever we want to log out, this is what we're using:

  ```javascript
    public logout(): Promise<any> {
    return new Promise((resolve, reject) => {
    // Remove tokens and expiry time from storage
      this.storage.ready().then(() => this.storage.remove('access_token'))
      .then(() => { return this.storage.remove('id_token') })
      .then(() => { return this.storage.remove('expires_at') })
      .then(() => resolve())
      .catch(error => {
        console.log(error);
      })
      this.isAuthenticated = false;
      console.log('Logged out successfully');
    })
  }    
  ```


The checkAuthentication medthod will be called from our app.components constructor. That way it will be invoked every time the app loads. We will also wrap it in a nice loader to let the user know something is going on. This is out app.component.ts:

```javascript
import { Component } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthenticationService} from '../providers/authentication-service/authentication-service';
import { Storage } from '@ionic/storage';

import { HomePage } from '../pages/home/home';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = HomePage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public auth: AuthenticationService, public storage: Storage, public loadingCtrl: LoadingController) {
    let loading = this.loadingCtrl.create({
      content: 'Authenticating...'
    });

    loading.present();
    this.auth.checkAuthentication().then(() => loading.dismiss() );


    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }
}
```

We will keep the Home component as our root page. Add a logout button to it.

```html
<ion-header>
  <ion-navbar>
    <ion-title>Home</ion-title>
  </ion-navbar>
</ion-header>

<ion-content padding>
<button *ngIf="auth.isAuthenticated" block ion-button (click)="logout()">Log out</button>
</ion-content>
```

In our Home component we add a single method, logout().

```javascript
import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { AuthenticationService } from '../../providers/authentication-service/authentication-service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public auth: AuthenticationService, public storage: Storage, public loadingCtrl: LoadingController) {

  }

  ionViewDidLoad() {
  }

  logout(){
    this.auth.logout()
      .then(() => {return this.auth.checkAuthentication()})
      .then((result) => {console.log('Logged back in: ', result)})
      .catch(error => {
        console.log(error);
      })
  }

}
```

It redirects the user to the log in screen.

That's it.