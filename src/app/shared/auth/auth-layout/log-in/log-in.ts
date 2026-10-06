import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-log-in',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {
  logInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.logInForm.invalid) {
      const email = this.logInForm.get('email')?.value;
      const password = this.logInForm.get('password')?.value;
      // Handle login logic here, e.g., call an authentication service
      console.log('Logging in with', email, password);
      this.logInForm.reset();
    }

  }
}
