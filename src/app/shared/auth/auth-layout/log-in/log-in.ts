import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Supabase } from '../../../../supabase';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-log-in',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {
  dbService = inject(Supabase);

  logInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  loginError = signal(false);

  async onSubmit() {
    if (this.logInForm.invalid) return;
    const { email, password } = this.logInForm.getRawValue();
    const user = await this.dbService.signIn(email ?? '', password ?? '');
    console.log('Login-Ergebnis:', user);
    this.loginError.set(!user);
    if (user) this.logInForm.reset();
  }
}
