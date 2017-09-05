import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import * as auth0 from 'auth0-js';

@Injectable()
export class AuthenticationService {

  auth0 = new auth0.WebAuth({
    clientID: 'bsXOdJFYIdhWxsjOyhcBovV3i4MJ1ec9',
    domain: 'sonnenielsen.eu.auth0.com',
    responseType: 'token id_token',
    audience: 'https://sonnenielsen.eu.auth0.com/userinfo',
    redirectUri: 'http://localhost:63021',
    scope: 'openid'
  });

  constructor() { }

  public login(): void {
    this.auth0.authorize();
  }
}