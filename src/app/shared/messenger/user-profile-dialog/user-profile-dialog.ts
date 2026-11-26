import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { Supabase } from '../../../supabase';
import { User } from '../../interfaces/user';

/**
 * Profil-Dialog für ANDERE User (nur ansehen, mit "Nachricht"-Button).
 * Profile dialog for OTHER users (read-only, with a "message" button).
 * Das eigene Profil mit Bearbeiten ist weiterhin <app-profile-dialog>.
 * Your own profile with editing is still <app-profile-dialog>.
 */
@Component({
  selector: 'app-user-profile-dialog',
  imports: [],
  templateUrl: './user-profile-dialog.html',
  styleUrl: './user-profile-dialog.scss',
})
export class UserProfileDialog {
  /** supabase = Supabase Service (für Online-Status) */
  supabase = inject(Supabase);

  /** dialog = Referenz auf das <dialog>-Element im Template */
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** selectedUser = User, dessen Profil im Dialog gezeigt wird, Start: null */
  selectedUser = signal<User | null>(null);

  /** messageClick = Output nach außen: meldet Klick auf "Nachricht" mit der User-ID (die Eltern-Komponente öffnet den Chat) */
  messageClick = output<string>();

  /**
   * Zeigt das Profil eines Users im Dialog an.
   * Shows a user's profile in the dialog.
   * @param user - User, dessen Profil gezeigt wird / user whose profile is shown
   */
  open(user: User) {
    /** selectedUser = übergebener User */
    this.selectedUser.set(user);
    /** Dialog als Modal öffnen */
    this.dialog().nativeElement.showModal();
  }

  /**
   * Schließt den Profil-Dialog.
   * Closes the profile dialog.
   */
  close() {
    /** Dialog schließen */
    this.dialog().nativeElement.close();
  }

  /**
   * Schließt den Dialog bei Klick auf den Hintergrund.
   * Closes the dialog when the backdrop is clicked.
   * @param event - Klick-Ereignis / click event
   */
  closeOnBackdrop(event: MouseEvent) {
    /** wenn (Klick-Ziel ist der Dialog selbst, also der ::backdrop) dann schließe Dialog */
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
