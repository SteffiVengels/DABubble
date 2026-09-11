import { Component } from '@angular/core';
import { LogIn } from './log-in/log-in';

@Component({
  selector: 'app-auth-layout',
  imports: [LogIn],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {

}
