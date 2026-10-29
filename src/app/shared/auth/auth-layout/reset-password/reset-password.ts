import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../../../supabase';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  resetPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  dbService = inject(Supabase);
  mailSent = signal(false);

  async onSubmit() {
    if (this.resetPasswordForm.invalid) return;
    const { email } = this.resetPasswordForm.getRawValue();
    const success = await this.dbService.sendPasswordResetMail(email ?? '');
    this.mailSent.set(success);
  }


}
