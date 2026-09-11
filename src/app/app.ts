import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogIn } from './shared/auth/auth-layout/log-in/log-in';
import { AuthLayout } from './shared/auth/auth-layout/auth-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LogIn, AuthLayout],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('DABubble');
}
