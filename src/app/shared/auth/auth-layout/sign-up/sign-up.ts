import { Component, inject, signal } from '@angular/core';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Supabase } from '../../../../supabase';
import { ChooseAvatar } from './choose-avatar/choose-avatar';
import { Toast } from '../../../toast/toast';


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, RouterLink, ChooseAvatar, ReactiveFormsModule, Toast],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  /** dbService = Supabase Service */
  dbService = inject(Supabase);
  /** router = Angular Router */
  router = inject(Router);


  /** step = Signal, welcher Schritt angezeigt wird ('form' oder 'avatar'), Start: 'form' */
  step = signal<'form' | 'avatar'>('form');
  /** accountCreated = Signal, ob Account erstellt wurde, Start: false */
  accountCreated = signal(false);
  /** emailTaken = Signal, ob E-Mail schon vergeben ist, Start: false */
  emailTaken = signal(false);
  /** signUpFailed = Signal, ob Registrierung fehlgeschlagen ist, Start: false */
  signUpFailed = signal(false);


  /** signUpForm = Formular mit Name, E-Mail, Passwort, Datenschutz */
  signUpForm = new FormGroup({
    /** name = Pflichtfeld */
    name: new FormControl('', [Validators.required]),
    /** email = Pflichtfeld, muss gültige E-Mail sein */
    email: new FormControl('', [Validators.required, Validators.email]),
    /** password = Pflichtfeld, mindestens 8 Zeichen */
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    /** privacyPolicy = Checkbox, muss angehakt sein */
    privacyPolicy: new FormControl(false, [Validators.requiredTrue]),
  });

  /**
   * Prüft das Formular und ob die E-Mail noch frei ist, und wechselt dann zur Avatar-Auswahl.
   * Validates the form and checks that the email is still available, then switches to avatar selection.
   */
  async goToAvatar() {
    /** wenn (Formular ist ungültig) dann beende Funktion */
    if (this.signUpForm.invalid) return;
    /** email = E-Mail aus Formular, sonst leerer Text */
    const email = this.signUpForm.getRawValue().email ?? '';
    /** taken = warte auf: emailExists(E-Mail) */
    const taken = await this.dbService.emailExists(email);
    /** emailTaken = taken */
    this.emailTaken.set(taken);
    /** wenn (E-Mail ist nicht vergeben) step = 'avatar' */
    if (!taken) this.step.set('avatar');
  }


  /**
   * Wechselt von der Avatar-Auswahl zurück zum Formular.
   * Switches from avatar selection back to the form.
   */
  goBackToForm() {
    /** step = 'form' */
    this.step.set('form');
  }

  /**
   * Registriert den Account und legt anschließend das Profil mit dem gewählten Avatar an.
   * Registers the account and then creates the profile with the chosen avatar.
   *
   * @param avatar - Pfad zum ausgewählten Avatar-Bild. / Path to the selected avatar image.
   */
  async createAccount(avatar: string) {
    /** name, email, password, privacyPolicy = Werte aus Formular */
    const { name, email, password, privacyPolicy } = this.signUpForm.getRawValue();
    /** authUser = warte auf: signUp(E-Mail, Passwort) */
    const authUser = await this.dbService.signUp(email ?? '', password ?? '');
    /** wenn (authUser ist nicht vorhanden) gib showSignUpError() zurück */
    if (!authUser) return this.showSignUpError();
    /** newUser = warte auf: addUser(Profildaten) */
    const newUser = await this.dbService.addUser({
      /** id = ID vom authUser */
      id: authUser.id,
      /** name = Name, sonst leerer Text */
      name: name ?? '',
      /** email = E-Mail, sonst leerer Text */
      email: email ?? '',
      /** privacy_policy = Checkbox-Wert, sonst false */
      privacy_policy: privacyPolicy ?? false,
      /** avatar = gewählter Avatar */
      avatar,
    });
    /** zeige newUser in Konsole */
    console.log('Neuer User:', newUser);
    /** wenn (newUser ist vorhanden) warte auf Funktion finishSignUp() */
    if (newUser) await this.finishSignUp();
  }

  /**
   * Meldet den neuen User ab, zeigt eine Erfolgsmeldung und leitet zur Startseite weiter.
   * Signs the new user out, shows a success message and navigates to the start page.
   */
  async finishSignUp() {
    /** warte auf: signOut() */
    await this.dbService.signOut();
    /** accountCreated = true (Erfolgsmeldung anzeigen) */
    this.accountCreated.set(true);
    /** nach 1,3 Sekunden gehe zur Startseite */
    setTimeout(() => this.router.navigate(['/']), 1300);
  }

  /**
   * Zeigt eine Fehlermeldung und kehrt zum Formular zurück.
   * Shows an error message and returns to the form.
   */
  showSignUpError() {
    /** signUpFailed = true (Fehlermeldung anzeigen) */
    this.signUpFailed.set(true);
    /** step = 'form' */
    this.step.set('form');
  }

}
