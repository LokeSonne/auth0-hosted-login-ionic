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
