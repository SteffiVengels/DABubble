import { Component, inject, signal } from '@angular/core';
import { WorkspaceMenu } from './workspace-menu/workspace-menu';
import { MainChat } from './main-chat/main-chat';
import { SecondaryChat } from './secondary-chat/secondary-chat';
import { Supabase } from '../../supabase';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-messenger',
  imports: [WorkspaceMenu, MainChat, SecondaryChat, RouterLink],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss',
})
export class Messenger {
  /** isOpen = ob das Menü offen ist, Start: true */
  isOpen = true;
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** router = Angular Router für die Weiterleitung */
  router = inject(Router);
  /** changeName = ob das Profil gerade bearbeitet wird */
  changeName = signal(false);
  /** changeAvatar = ob der Avatar geändert werden soll */
  changeAvatar = signal(false);
  /** editName = aktueller Inhalt des Namensfelds */
  editName = signal('');
  /** editAvatar = aktueller Avatar */
  editAvatar = signal('');
    /** avatars = Liste der Bildpfade zur Auswahl */
  avatars = [
    '/img/women2.png', '/img/men1.png', '/img/men2.png',
    '/img/men3.png', '/img/women1.png', '/img/men4.png',
  ];
  /** selectedAvatar = Signal mit gewähltem Bild, Start: Platzhalter-Bild */
  selectedAvatar = signal('/img/person.png');

  /**
   * Meldet den User ab, schließt das Menü und leitet zum Login weiter.
   * Signs the user out, closes the menu and redirects to the login.
   */
  async signOut() {
    /** warte auf: signOut() */
    await this.supabase.signOut();
    /** leite zum Login weiter */
    this.router.navigate(['/auth/login']);
  }

  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
    // Ein Klick auf den ::backdrop hat den Dialog selbst als Target
    if (event.target === dialog) dialog.close();
  }

  /**
   * Speichert den neuen Namen und beendet den Bearbeiten-Modus.
   * Saves the new name and leaves edit mode.
   */
  async saveName(dialog: HTMLDialogElement) {
    /** name = Inhalt vom Namensfeld ohne Leerzeichen am Anfang/Ende */
    const name = this.editName().trim();
    /** user = eingeloggter User */
    const user = this.supabase.currentUser();
    /** wenn (kein User oder Name ist leer) dann beende Funktion */
    if (!user || !name) return;
    /** success = warte auf: updateUserName(User ID, Name) */
    const success = await this.supabase.updateUserName(user.id, name);
    /** wenn (success) dann beende Bearbeiten-Modus */
    if (success)  {
      this.changeName.set(false);
      dialog.close()
    }
      
  }

  async saveAvatar(dialog: HTMLDialogElement) {
    const avatar = this.editAvatar();
    const user = this.supabase.currentUser();
    if (!user || !avatar) return;
    const success = await this.supabase.updateUserAvatar(user.id, avatar);
    if (success) {
      this.changeAvatar.set(false);
      dialog.close()
    }
  }

}
