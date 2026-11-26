import { Component, inject, viewChild } from '@angular/core';
import { WorkspaceMenu } from './workspace-menu/workspace-menu';
import { MainChat } from './main-chat/main-chat';
import { Threads } from './threads/threads';
import { ProfileDialog } from './profile-dialog/profile-dialog';
import { UserProfileDialog } from './user-profile-dialog/user-profile-dialog';
import { Supabase } from '../../supabase';
import { Router, RouterLink } from '@angular/router';
import { ChatState } from '../../chat-state';
import { User } from '../interfaces/user';

@Component({
  selector: 'app-messenger',
  imports: [WorkspaceMenu, MainChat, Threads, ProfileDialog, UserProfileDialog, RouterLink],
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
  /** chatState = ChatState Service (welcher Chat offen ist) */
  chatState = inject(ChatState);

  /** userProfileDialog = Referenz auf den Profil-Dialog für andere User (nur ansehen) */
  userProfileDialog = viewChild.required(UserProfileDialog);

  /** ownChatProfileDialog = Referenz auf den eigenen Profil-Dialog aus dem Chat (mittig, mit "Nachricht"-Button), per #ownChatProfile im Template */
  ownChatProfileDialog = viewChild.required<ProfileDialog>('ownChatProfile');

  /**
   * Öffnet das Profil eines Users: das eigene (kein Gast) bearbeitbar, alle anderen nur zum Ansehen.
   * Opens a user's profile: your own (not guest) editable, all others read-only.
   * Wird von main-chat (und später threads) über (showProfile) aufgerufen.
   * Called by main-chat (and later threads) via (showProfile).
   * @param user - angeklickter User / clicked user
   */
  showUserProfile(user: User) {
    /** wenn (User ist eingeloggter User und kein Gast) dann */
    if (this.isOwnEditableProfile(user)) {
      /** eigenen ProfileDialog öffnen (zeigt currentUser mit Bearbeiten) */
      this.ownChatProfileDialog().open();
      /** beende Funktion */
      return;
    }
    /** Profil-Dialog für andere User mit diesem User öffnen */
    this.userProfileDialog().open(user);
  }

  /**
   * Prüft, ob der User das eigene Profil ist und kein Gast.
   * Checks whether the user is your own profile and not a guest.
   * @param user - zu prüfender User / user to check
   * @returns true, wenn eigenes bearbeitbares Profil / true if own editable profile
   */
  isOwnEditableProfile(user: User) {
    /** gib zurück: (User ID ist gleich currentUserId) */
    return user.id === this.supabase.currentUserId() &&
      /** und (E-Mail ist nicht Gast-E-Mail) */
      user.email !== this.supabase.guestEmail;
  }

  /**
   * Schließt beide Profil-Dialoge und öffnet die Direktnachricht mit dem User.
   * Closes both profile dialogs and opens the direct message with the user.
   * @param userId - ID vom Gesprächspartner / ID of the conversation partner
   */
  openMessage(userId: string) {
    /** Profil-Dialog (anderer User) schließen */
    this.userProfileDialog().close();
    /** eigenen Profil-Dialog schließen */
    this.ownChatProfileDialog().close();
    /** Direktnachricht mit User öffnen (channel-header verschwindet dadurch, sein offenes Panel also auch) */
    this.chatState.openDirectMessage(userId);
  }


  /**
   * Meldet den User ab, schließt das Menü und leitet zum Login weiter.
   * Signs the user out, closes the menu and redirects to the login.
   */
  async signOut() {
    /** warte auf: signOut() */
    await this.supabase.signOut();
    this.chatState.activeChat.set({ type: 'channel', channelId: 1 })
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
