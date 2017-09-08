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

