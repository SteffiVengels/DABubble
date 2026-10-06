import { Component, inject } from '@angular/core';
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

  async ngOnInit() {
    await this.dbService.getUsers();
    console.log('Users:', this.dbService.users());
  }

  logInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.logInForm.valid) {
      const email = this.logInForm.get('email')?.value;
      const password = this.logInForm.get('password')?.value;
      console.log('Logging in with', email, password);
      const user = this.dbService.users().find(u => u.email === email);
      if (user) {
        if (user.password === password) {
          console.log('Login successful for user:', user);
        } else {
          console.log('Invalid password, please try again or reset your password');
          // Handle login logic here, e.g., call an authentication service
          console.log('Logging in with', email, password);
        }
      } else {
        console.log('Invalid email, please sign up first');
        // Handle login logic here, e.g., call an authentication service
        console.log('Logging in with', email, password);
      }
      this.logInForm.reset();
    }
    
  }
}
