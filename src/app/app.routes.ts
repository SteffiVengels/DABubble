import { Routes } from '@angular/router';
import { AuthLayout } from './shared/auth/auth-layout/auth-layout';
import { LogIn } from './shared/auth/auth-layout/log-in/log-in';
import { SignUp } from './shared/auth/auth-layout/sign-up/sign-up';
import { ResetPassword } from './shared/auth/auth-layout/reset-password/reset-password';
import { LegalNotice } from './shared/legal-notice/legal-notice';
import { PrivacyPolice } from './shared/privacy-police/privacy-police';
import { Messenger } from './shared/messenger/messenger';
import { NewPassword } from './shared/auth/auth-layout/new-password/new-password';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: LogIn },
      { path: 'signup', component: SignUp },
      { path: 'reset-password', component: ResetPassword },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'new-password', component: NewPassword },

    ],
  },
  { path: 'impressum', component: LegalNotice },
  { path: 'datenschutz', component: PrivacyPolice },
  { path: 'messenger', component: Messenger },
];
