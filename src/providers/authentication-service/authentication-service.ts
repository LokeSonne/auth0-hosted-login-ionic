import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import * as auth0 from 'auth0-js';
import { Storage } from '@ionic/storage';

@Injectable()
export class AuthenticationService {
  isAuthenticated = false;

  auth0 = new auth0.WebAuth({
    clientID: 'yourclientid',
    domain: 'yourdomain.eu.auth0.com',
    responseType: 'token id_token',
    audience: 'https://yourdomain.eu.auth0.com/userinfo',
    redirectUri: 'http://localhost:4200',
    scope: 'openid'
  });

  constructor(public storage: Storage) { }

  public login(): Promise<any> {
    return new Promise((resolve, reject) => {
    this.auth0.authorize();
    resolve('Redirected');
    })
  }


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
}