import { Component, signal } from '@angular/core';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChooseAvatar } from './choose-avatar/choose-avatar';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterLink, ChooseAvatar, ReactiveFormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  step = signal<'form' | 'avatar'>('form');

  signUpForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });

  goToAvatar() {
    if (this.signUpForm.valid) {
      this.step.set('avatar');
    }
  }

  goBackToForm() {
    this.step.set('form');
  }

}
