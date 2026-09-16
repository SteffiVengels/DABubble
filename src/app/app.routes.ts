import { Routes } from '@angular/router';
import { AuthLayout } from './shared/auth/auth-layout/auth-layout';
import { LogIn } from './shared/auth/auth-layout/log-in/log-in';
import { SignIn } from './shared/auth/auth-layout/sign-in/sign-in';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: LogIn },
      { path: 'signup', component: SignIn },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
