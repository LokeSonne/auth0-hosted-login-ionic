import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { AuthenticationService } from '../../providers/authentication-service/authentication-service';

@Component({
  selector: 'page-show-loader',
  templateUrl: 'show-loader.html'
})
export class ShowLoaderPage {

  constructor(public navCtrl: NavController, public auth: AuthenticationService, public loadingCtrl: LoadingController) {
    this.authenticate();

  }
  authenticate(){
    /// create a spinner that shows that we are checking authentication

    let loading = this.loadingCtrl.create({
      content: 'Authenticating...'
    });

    loading.present();
    this.auth.login();
  }

}