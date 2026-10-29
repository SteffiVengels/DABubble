import { Component, inject, signal } from '@angular/core';
import { Supabase } from '../../../../supabase';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-new-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './new-password.html',
  styleUrl: './new-password.scss',
})
export class NewPassword {
  dbService = inject(Supabase);
  router = inject(Router);
  passwordsMismatch = signal(false);

  newPasswordForm = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  async onSubmit() {
    const { password, confirmPassword } = this.newPasswordForm.getRawValue();
    this.passwordsMismatch.set(password !== confirmPassword);
    if (this.newPasswordForm.invalid || this.passwordsMismatch()) return;
    const success = await this.dbService.updatePassword(password ?? '');
    if (success) await this.finishReset();
  }

  async finishReset() {
    await this.dbService.signOut();
    this.router.navigate(['/auth/login']);
  }


}
