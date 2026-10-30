import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../../../supabase';
import { Toast } from '../../../toast/toast';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, ReactiveFormsModule, Toast],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  resetPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  dbService = inject(Supabase);
  router = inject(Router);
  mailSent = signal(false);
  emailNotFound = signal(false);


  async onSubmit() {
    if (this.resetPasswordForm.invalid) return;
    const { email } = this.resetPasswordForm.getRawValue();
    const exists = await this.dbService.emailExists(email ?? '');
    this.emailNotFound.set(!exists);
    if (!exists) return;
    this.showSuccessAndRedirect();
    this.dbService.sendPasswordResetMail(email ?? '');
  }

  showSuccessAndRedirect() {
    this.mailSent.set(true);
    setTimeout(() => this.router.navigate(['/']), 1300);
  }

}
