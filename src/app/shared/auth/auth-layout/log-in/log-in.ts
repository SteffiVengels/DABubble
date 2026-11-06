import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Supabase } from '../../../../supabase';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-log-in',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {
  /** dbService = Supabase Service */
  dbService = inject(Supabase);
  /** router = Angular Router */
  router = inject(Router);

  /** logInForm = Formular mit E-Mail und Passwort */
  logInForm = new FormGroup({
    /** email = Pflichtfeld, muss gültige E-Mail sein */
    email: new FormControl('', [Validators.required, Validators.email]),
    /** password = Pflichtfeld, mindestens 8 Zeichen */
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  /** loginError = Signal, ob Login fehlgeschlagen ist, Start: false */
  loginError = signal(false);

  /**
   * Meldet den User mit den Formulardaten an und leitet bei Erfolg zum Messenger weiter.
   * Signs the user in with the form data and navigates to the messenger on success.
   */
  async onSubmit() {
    /** wenn (Formular ist ungültig) dann beende Funktion */
    if (this.logInForm.invalid) return;
    /** email, password = Werte aus Formular */
    const { email, password } = this.logInForm.getRawValue();
    /** user = warte auf: signIn(E-Mail, Passwort) */
    const user = await this.dbService.signIn(email ?? '', password ?? '');
    /** zeige user in Konsole */
    console.log('Login-Ergebnis:', user);
    /** loginError = true, wenn kein user, sonst false */
    this.loginError.set(!user);
    /** wenn (user ist vorhanden) gehe zu /messenger */
    if (user) this.router.navigate(['/messenger']);
  }

  /**
   * Meldet den Gast-Account an und leitet bei Erfolg zum Messenger weiter.
   * Signs in with the guest account and navigates to the messenger on success.
   */
  async guestLogin() {
    /** user = warte auf: signInAsGuest() */
    const user = await this.dbService.signInAsGuest();
    /** loginError = true, wenn kein user, sonst false */
    this.loginError.set(!user);
    /** wenn (user ist vorhanden) gehe zu /messenger */
    if (user) this.router.navigate(['/messenger']);
  }
}
