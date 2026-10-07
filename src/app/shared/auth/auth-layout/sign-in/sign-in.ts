import { Component, inject, signal } from '@angular/core';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Supabase } from '../../../../supabase';
import { ChooseAvatar } from './choose-avatar/choose-avatar';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterLink, ChooseAvatar, ReactiveFormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  dbService = inject(Supabase);

  async ngOnInit() {
    await this.dbService.getUsers();
    console.log('Users:', this.dbService.users());
  }

  step = signal<'form' | 'avatar'>('form');

  signUpForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });



  async goToAvatar() {
    const user = this.dbService.users().find(u => u.email === this.signUpForm.get('email')?.value);
    if (this.signUpForm.valid && !user) {
      const newUser = await this.dbService.addUser({
        name: this.signUpForm.get('name')?.value ?? '',
        email: this.signUpForm.get('email')?.value ?? '',
        password: this.signUpForm.get('password')?.value ?? '',
        privacy_policy: this.signUpForm.get('privacyPolicy')?.value ?? false,
      });
      if (newUser) {
        console.log('User created:', newUser);
        this.step.set('avatar');
      }
    } else {
      console.log('Form is invalid or user already exists. Please check your input or log in instead.');
    }
  }

  goBackToForm() {
    this.step.set('form');
  }

}
