import { Routes } from '@angular/router';
import { AuthLayout } from './shared/auth/auth-layout/auth-layout';
import { LogIn } from './shared/auth/auth-layout/log-in/log-in';
import { SignIn } from './shared/auth/auth-layout/sign-in/sign-in';
import { ResetPassword } from './shared/auth/auth-layout/reset-password/reset-password';
import { LegalNotice } from './shared/legal-notice/legal-notice';
import { PrivacyPolice } from './shared/privacy-police/privacy-police';
import { Messenger } from './shared/messenger/messenger';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: LogIn },
      { path: 'signup', component: SignIn },
      { path: 'reset-password', component: ResetPassword },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  { path: 'impressum', component: LegalNotice },
  { path: 'datenschutz', component: PrivacyPolice },
  { path: 'messenger', component: Messenger },
];
