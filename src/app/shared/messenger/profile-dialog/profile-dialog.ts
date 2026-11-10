import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-profile-dialog',
  imports: [],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss',
})
export class ProfileDialog {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** dialog = Referenz auf das <dialog>-Element im Template */
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  /** changeName = ob der Name gerade bearbeitet wird */
  changeName = signal(false);
  /** changeAvatar = ob der Avatar gerade geändert wird */
  changeAvatar = signal(false);
  /** editName = aktueller Inhalt des Namensfelds */
  editName = signal('');
  /** editAvatar = aktuell ausgewählter Avatar */
  editAvatar = signal('');
  /** avatars = Liste der Bildpfade zur Auswahl */
  avatars = [
    '/img/women2.png', '/img/men1.png', '/img/men2.png',
    '/img/men3.png', '/img/women1.png', '/img/men4.png',
  ];

  /**
   * Öffnet den Profil-Dialog.
   * Opens the profile dialog.
   */
  open() {
    this.dialog().nativeElement.showModal();
  }

  /**
   * Schließt den Profil-Dialog.
   * Closes the profile dialog.
   */
  close() {
    this.dialog().nativeElement.close();
  }

  /**
   * Setzt den Bearbeiten-Modus zurück (wird beim Schließen aufgerufen).
   * Resets edit mode (called when the dialog closes).
   */
  resetEditMode() {
    this.changeName.set(false);
    this.changeAvatar.set(false);
  }

  /**
   * Schließt den Dialog bei Klick auf den Hintergrund.
   * Closes the dialog when the backdrop is clicked.
   */
  closeOnBackdrop(event: MouseEvent) {
    // Ein Klick auf den ::backdrop hat den Dialog selbst als Target
    if (event.target === this.dialog().nativeElement) this.close();
  }

  /**
   * Speichert den neuen Namen und schließt den Dialog.
   * Saves the new name and closes the dialog.
   */
  async saveName() {
    /** name = Inhalt vom Namensfeld ohne Leerzeichen am Anfang/Ende */
    const name = this.editName().trim();
    /** user = eingeloggter User */
    const user = this.supabase.currentUser();
    /** wenn (kein User oder Name ist leer) dann beende Funktion */
    if (!user || !name) return;
    /** success = warte auf: updateUserName(User ID, Name) */
    const success = await this.supabase.updateUserName(user.id, name);
    /** wenn (success) dann schließe Dialog (setzt Bearbeiten-Modus zurück) */
    if (success) this.close();
  }

  /**
   * Speichert den neuen Avatar und schließt den Dialog.
   * Saves the new avatar and closes the dialog.
   */
  async saveAvatar() {
    /** avatar = ausgewählter Avatar */
    const avatar = this.editAvatar();
    /** user = eingeloggter User */
    const user = this.supabase.currentUser();
    /** wenn (kein User oder kein Avatar) dann beende Funktion */
    if (!user || !avatar) return;
    /** success = warte auf: updateUserAvatar(User ID, Avatar) */
    const success = await this.supabase.updateUserAvatar(user.id, avatar);
    /** wenn (success) dann schließe Dialog (setzt Bearbeiten-Modus zurück) */
    if (success) this.close();
  }
}
