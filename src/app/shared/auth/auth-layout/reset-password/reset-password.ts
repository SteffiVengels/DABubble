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
  /** resetPasswordForm = Formular mit E-Mail */
  resetPasswordForm = new FormGroup({
    /** email = Pflichtfeld, muss gültige E-Mail sein */
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  /** dbService = Supabase Service */
  dbService = inject(Supabase);
  /** router = Angular Router */
  router = inject(Router);
  /** mailSent = Signal, ob Mail verschickt wurde, Start: false */
  mailSent = signal(false);
  /** emailNotFound = Signal, ob E-Mail nicht registriert ist, Start: false */
  emailNotFound = signal(false);


  /**
   * Prüft, ob die E-Mail registriert ist, und schickt dann die Mail zum Zurücksetzen des Passworts.
   * Checks whether the email is registered and then sends the password reset email.
   */
  async onSubmit() {
    /** wenn (Formular ist ungültig) dann beende Funktion */
    if (this.resetPasswordForm.invalid) return;
    /** email = Wert aus Formular */
    const { email } = this.resetPasswordForm.getRawValue();
    /** exists = warte auf: emailExists(E-Mail) */
    const exists = await this.dbService.emailExists(email ?? '');
    /** emailNotFound = true, wenn E-Mail nicht existiert */
    this.emailNotFound.set(!exists);
    /** wenn (E-Mail existiert nicht) dann beende Funktion */
    if (!exists) return;
    /** führe Funktion showSuccessAndRedirect() aus */
    this.showSuccessAndRedirect();
    /** führe Funktion sendPasswordResetMail(E-Mail) aus */
    this.dbService.sendPasswordResetMail(email ?? '');
  }

  /**
   * Zeigt eine Erfolgsmeldung und leitet zur Startseite weiter.
   * Shows a success message and navigates to the start page.
   */
  showSuccessAndRedirect() {
    /** mailSent = true (Erfolgsmeldung anzeigen) */
    this.mailSent.set(true);
    /** nach 1,3 Sekunden gehe zur Startseite */
    setTimeout(() => this.router.navigate(['/']), 1300);
  }

}
