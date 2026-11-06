/** importiere Typ Routes aus Angular Router */
import { Routes } from '@angular/router';
/** importiere alle Seiten-Komponenten */
import { AuthLayout } from './shared/auth/auth-layout/auth-layout';
import { LogIn } from './shared/auth/auth-layout/log-in/log-in';
import { SignUp } from './shared/auth/auth-layout/sign-up/sign-up';
import { ResetPassword } from './shared/auth/auth-layout/reset-password/reset-password';
import { LegalNotice } from './shared/legal-notice/legal-notice';
import { PrivacyPolice } from './shared/privacy-police/privacy-police';
import { Messenger } from './shared/messenger/messenger';
import { NewPassword } from './shared/auth/auth-layout/new-password/new-password';

/** routes = Liste aller Seiten (URL -> Komponente) */
export const routes: Routes = [
  /** wenn (URL ist leer) dann gehe zu auth/login */
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    /** URL /auth zeigt AuthLayout */
    path: 'auth',
    component: AuthLayout,
    /** Unterseiten im AuthLayout */
    children: [
      /** /auth/login -> LogIn */
      { path: 'login', component: LogIn },
      /** /auth/signup -> SignUp */
      { path: 'signup', component: SignUp },
      /** /auth/reset-password -> ResetPassword */
      { path: 'reset-password', component: ResetPassword },
      /** wenn (URL ist nur /auth) dann gehe zu /auth/login */
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      /** /auth/new-password -> NewPassword */
      { path: 'new-password', component: NewPassword },

    ],
  },
  /** /impressum -> LegalNotice */
  { path: 'impressum', component: LegalNotice },
  /** /datenschutz -> PrivacyPolice */
  { path: 'datenschutz', component: PrivacyPolice },
  /** /messenger -> Messenger */
  { path: 'messenger', component: Messenger },
];
