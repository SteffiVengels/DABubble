import { Component, inject, signal } from '@angular/core';
import { Supabase } from '../../../../supabase';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Toast } from '../../../toast/toast';


@Component({
  selector: 'app-new-password',
  imports: [RouterLink, ReactiveFormsModule, Toast],
  templateUrl: './new-password.html',
  styleUrl: './new-password.scss',
})
export class NewPassword {
  /** dbService = Supabase Service */
  dbService = inject(Supabase);
  /** router = Angular Router */
  router = inject(Router);
  /** passwordsMismatch = Signal, ob Passwörter unterschiedlich sind, Start: false */
  passwordsMismatch = signal(false);
  /** passwordChanged = Signal, ob Passwort geändert wurde, Start: false */
  passwordChanged = signal(false);


  /** newPasswordForm = Formular mit Passwort und Wiederholung */
  newPasswordForm = new FormGroup({
    /** password = Pflichtfeld, mindestens 8 Zeichen */
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    /** confirmPassword = Pflichtfeld */
    confirmPassword: new FormControl('', [Validators.required]),
  });

  /**
   * Prüft, ob beide Passwörter übereinstimmen, und speichert dann das neue Passwort.
   * Checks that both passwords match and then saves the new password.
   */
  async onSubmit() {
    /** password, confirmPassword = Werte aus Formular */
    const { password, confirmPassword } = this.newPasswordForm.getRawValue();
    /** passwordsMismatch = true, wenn (password ist nicht gleich confirmPassword) */
    this.passwordsMismatch.set(password !== confirmPassword);
    /** wenn (Formular ist ungültig oder Passwörter unterschiedlich) dann beende Funktion */
    if (this.newPasswordForm.invalid || this.passwordsMismatch()) return;
    /** success = warte auf: updatePassword(Passwort) */
    const success = await this.dbService.updatePassword(password ?? '');
    /** wenn (success ist true) warte auf Funktion finishReset() */
    if (success) await this.finishReset();
  }

  /**
   * Meldet den User ab, zeigt eine Erfolgsmeldung und leitet zum Login weiter.
   * Signs the user out, shows a success message and navigates to the login page.
   */
  async finishReset() {
    /** warte auf: signOut() */
    await this.dbService.signOut();
    /** passwordChanged = true (Erfolgsmeldung anzeigen) */
    this.passwordChanged.set(true);
    /** nach 1,3 Sekunden gehe zu /auth/login */
    setTimeout(() => this.router.navigate(['/auth/login']), 1300);
  }

}
