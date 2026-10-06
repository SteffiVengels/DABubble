import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      const email = this.resetPasswordForm.get('email')?.value;
      // Handle reset password logic here, e.g., call a password reset service
      console.log('Resetting password for', email);
      this.resetPasswordForm.reset();
    }
  }

}
