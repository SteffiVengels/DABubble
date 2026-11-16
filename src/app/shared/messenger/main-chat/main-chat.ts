import { Component, inject, signal, computed } from '@angular/core';
import { Supabase } from '../../../supabase';
import { ChatState } from '../../../chat-state';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-main-chat',
  imports: [],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat {
  /** Supabase-Service injizieren */
  supabase = inject(Supabase);
  /** chatState = ChatState Service (welcher Chat offen ist) */
  chatState = inject(ChatState);

  /** openPanel = Signal, welches Panel gerade offen ist ('editChannel' / 'showMembers' / 'addMembers'), Start: null (keins) */
  openPanel = signal<'editChannel' | 'showMembers' | 'addMembers' | null>(null);
  /** selectedUsers = ausgewählte User für den neuen Channel, Start: leere Liste */
  selectedUsers = signal<User[]>([]);
  /** memberSearch = Text im Suchfeld "Name eingeben", Start: leer */
  memberSearch = signal('');

  getUserName(userId: string) {
    return this.supabase.users().find(user => user.id === userId)?.name ?? 'Unbekannt';
  }

  channelMembers = computed(() => {
    const channel = this.chatState.activeChannel();
    if (!channel) return [];
    return this.supabase.users().filter(user => channel.memberIds.includes(user.id));
  });

  /**
    * Speichert den Suchtext aus dem Input-Feld.
    * Stores the search text from the input field.
    */
  onMemberSearch(event: Event) {
    /** memberSearch = Wert aus dem Input-Feld (event.target als Input-Element behandeln) */
    this.memberSearch.set((event.target as HTMLInputElement).value);
  }

  /**
     * Fügt einen User zur Auswahl hinzu und leert das Suchfeld.
     * Adds a user to the selection and clears the search field.
     */
  addUser(user: User) {
    /** selectedUsers = neue Liste aus (alte Liste + User) */
    this.selectedUsers.update(list => [...list, user]);
    /** memberSearch = leer (Suchfeld leeren, Ergebnisliste schließt sich) */
    this.memberSearch.set('');
  }

  /**
     * Entfernt einen User aus der Auswahl.
     * Removes a user from the selection.
     */
  removeUser(user: User) {
    /** selectedUsers = filtere Liste, behalte alle außer (ID ist gleich User ID) */
    this.selectedUsers.update(list => list.filter(selected => selected.id !== user.id));
  }

  filteredUsers = computed(() => {
    /** term = Suchtext ohne Leerzeichen am Rand, in Kleinbuchstaben */
    const term = this.memberSearch().trim().toLowerCase();
    /** selectedIds = IDs der schon ausgewählten User */
    const selectedIds = this.selectedUsers().map(user => user.id);
    /** gib zurück: filtere directMessageUsers */
    return this.supabase.directMessageUsers().filter(user =>
      /** behalte User, wenn (nicht ich selbst, Ersteller ist automatisch Mitglied) */
      user.id !== this.supabase.currentUserId() &&
      /** und (noch nicht ausgewählt) */
      !selectedIds.includes(user.id) &&
      /** und (Name in Kleinbuchstaben enthält den Suchtext) */
      user.name.toLowerCase().includes(term)
    );
  });

}
