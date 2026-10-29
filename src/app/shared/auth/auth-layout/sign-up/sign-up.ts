import { Component, inject, signal } from '@angular/core';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Supabase } from '../../../../supabase';
import { ChooseAvatar } from './choose-avatar/choose-avatar';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, RouterLink, ChooseAvatar, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  dbService = inject(Supabase);
  router = inject(Router);


  step = signal<'form' | 'avatar'>('form');

  signUpForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });

  goToAvatar() {
    if (this.signUpForm.valid) this.step.set('avatar');
  }

  goBackToForm() {
    this.step.set('form');
  }

  async createAccount(avatar: string) {
    const { name, email, password, privacyPolicy } = this.signUpForm.getRawValue();
    const authUser = await this.dbService.signUp(email ?? '', password ?? '');
    if (!authUser) return;
    const newUser = await this.dbService.addUser({
      id: authUser.id,
      name: name ?? '',
      email: email ?? '',
      privacy_policy: privacyPolicy ?? false,
      avatar,
    });
    console.log('Neuer User:', newUser);
    if (newUser) await this.finishSignUp();
  }

  async finishSignUp() {
    await this.dbService.signOut();
    this.router.navigate(['/']);
  }


}
