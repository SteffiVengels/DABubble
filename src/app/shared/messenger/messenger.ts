import { Component, inject } from '@angular/core';
import { WorkspaceMenu } from './workspace-menu/workspace-menu';
import { MainChat } from './main-chat/main-chat';
import { SecondaryChat } from './secondary-chat/secondary-chat';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { Supabase } from '../../supabase';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-messenger',
  imports: [WorkspaceMenu, MainChat, SecondaryChat, ProfileDialog, RouterLink],
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

  /**
   * Schließt einen Dialog bei Klick auf den Hintergrund.
   * Closes a dialog when its backdrop is clicked.
   * @param event - Klick-Ereignis / click event
   * @param dialog - Dialog, der geschlossen werden soll / dialog to close
   */
  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
    /** wenn (Klick-Ziel ist der Dialog selbst, also der ::backdrop) dann schließe Dialog */
    if (event.target === dialog) dialog.close();
  }
}
