import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChooseAvatar } from './choose-avatar/choose-avatar';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterLink, ChooseAvatar],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  step = signal<'form' | 'avatar'>('form');

  goToAvatar() {
    this.step.set('avatar');
  }

  goBackToForm() {
    this.step.set('form');
  }

}
