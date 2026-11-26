import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Supabase } from '../../../../supabase';
import { ChatState } from '../../../../chat-state';
import { Channel } from '../../../interfaces/channel';
import { User } from '../../../interfaces/user';

/**
 * Kopfzeile eines Channels mit den Panels "Channel bearbeiten", "Mitglieder" und "Leute hinzufügen".
 * Header of a channel with the panels "edit channel", "members" and "add people".
 */
@Component({
  selector: 'app-channel-header',
  imports: [],
  templateUrl: './channel-header.html',
  styleUrl: './channel-header.scss',
})
export class ChannelHeader {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** chatState = ChatState Service (welcher Chat offen ist) */
  chatState = inject(ChatState);

  /** channel = Channel, dessen Kopf angezeigt wird (Pflicht-Input von der Eltern-Komponente) */
  channel = input.required<Channel>();

  /** showProfile = Event an die Eltern-Komponente: "zeige das Profil von diesem User" (Profil-Dialoge liegen in main-chat) */
  showProfile = output<User>();

  /** openPanel = Signal, welches Panel gerade offen ist ('editChannel' / 'showMembers' / 'addMembers'), Start: null (keins) */
  openPanel = signal<'editChannel' | 'showMembers' | 'addMembers' | null>(null);
  /** selectedUsers = ausgewählte User zum Hinzufügen, Start: leere Liste */
  selectedUsers = signal<User[]>([]);
  /** memberSearch = Text im Suchfeld "Name eingeben", Start: leer */
  memberSearch = signal('');

  /** editingChannelName = Signal, ob der Channel-Name gerade bearbeitet wird, Start: false */
  editingChannelName = signal(false);
  /** channelNameInput = aktueller Wert im Input für den Channel-Namen, Start: leer */
  channelNameInput = signal('');

  /** editingChannelDescription = Signal, ob die Beschreibung gerade bearbeitet wird, Start: false */
  editingChannelDescription = signal(false);
  /** channelDescriptionInput = aktueller Wert im Input für die Beschreibung, Start: leer */
  channelDescriptionInput = signal('');

  /** isSaving = ob gerade gespeichert wird (Button sperren gegen Doppelklick), Start: false */
  isSaving = signal(false);

  /** channelMembers = alle User, die Mitglied im Channel sind */
  channelMembers = computed(() => {
    /** memberIds = IDs der Mitglieder vom Channel */
    const memberIds = this.channel().memberIds;
    /** gib zurück: filtere users, behalte User, wenn (memberIds enthält User ID) */
    return this.supabase.users().filter(user => memberIds.includes(user.id));
  });

  /** filteredUsers = User, die zum Suchtext passen und noch nicht ausgewählt sind */
  filteredUsers = computed(() => {
    /** term = Suchtext ohne Leerzeichen am Rand, in Kleinbuchstaben */
    const term = this.memberSearch().trim().toLowerCase();
    /** selectedIds = IDs der schon ausgewählten User */
    const selectedIds = this.selectedUsers().map(user => user.id);
    /** memberIds = IDs der Channel-Mitglieder */
    const memberIds = this.channel().memberIds;
    /** gib zurück: filtere directMessageUsers */
    return this.supabase.directMessageUsers().filter(user =>
      /** behalte User, wenn (noch nicht Mitglied im Channel) */
      !memberIds.includes(user.id) &&
      /** und (noch nicht ausgewählt) */
      !selectedIds.includes(user.id) &&
      /** und (Name in Kleinbuchstaben enthält den Suchtext) */
      user.name.toLowerCase().includes(term)
    );
  });

  /**
   * Sucht den Namen zu einer User-ID.
   * Looks up the name for a user ID.
   * @param userId - ID vom gesuchten User / ID of the user to look up
   * @returns Name vom User, sonst 'Unbekannt' / the user's name, otherwise 'Unbekannt'
   */
  getUserName(userId: string) {
    /** gib zurück: suche in users den User mit (user.id ist gleich userId) und nimm seinen Namen, sonst 'Unbekannt' */
    return this.supabase.users().find(user => user.id === userId)?.name ?? 'Unbekannt';
  }

  /**
   * Speichert den Suchtext aus dem Input-Feld.
   * Stores the search text from the input field.
   * @param event - Input-Ereignis vom Suchfeld / input event from the search field
   */
  onMemberSearch(event: Event) {
    /** memberSearch = Wert aus dem Input-Feld (event.target als Input-Element behandeln) */
    this.memberSearch.set((event.target as HTMLInputElement).value);
  }

  /**
   * Fügt einen User zur Auswahl hinzu und leert das Suchfeld.
   * Adds a user to the selection and clears the search field.
   * @param user - ausgewählter User / selected user
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
   * @param user - zu entfernender User / user to remove
   */
  removeUser(user: User) {
    /** selectedUsers = filtere Liste, behalte alle außer (ID ist gleich User ID) */
    this.selectedUsers.update(list => list.filter(selected => selected.id !== user.id));
  }

  /**
   * Speichert den neuen Channel-Namen in Supabase und beendet den Bearbeiten-Modus.
   * Saves the new channel name to Supabase and ends edit mode.
   */
  async saveChannelName() {
    /** name = Inhalt vom Input ohne Leerzeichen am Rand */
    const name = this.channelNameInput().trim();
    /** wenn (Name ist leer) dann beende Funktion */
    if (!name) return;
    /** success = warte auf: updateChannel(Channel ID, neuer Name) */
    const success = await this.supabase.updateChannel(this.channel().id, { name });
    /** wenn (success) dann editingChannelName = false (Bearbeiten-Modus beenden) */
    if (success) this.editingChannelName.set(false);
  }

  /**
   * Speichert die neue Channel-Beschreibung in Supabase und beendet den Bearbeiten-Modus.
   * Saves the new channel description to Supabase and ends edit mode.
   */
  async saveChannelDescription() {
    /** description = Inhalt vom Input ohne Leerzeichen am Rand */
    const description = this.channelDescriptionInput().trim();
    /** wenn (Beschreibung ist leer) dann beende Funktion */
    if (!description) return;
    /** success = warte auf: updateChannel(Channel ID, neue Beschreibung) */
    const success = await this.supabase.updateChannel(this.channel().id, { description });
    /** wenn (success) dann editingChannelDescription = false (Bearbeiten-Modus beenden) */
    if (success) this.editingChannelDescription.set(false);
  }

  /**
   * Trägt den eingeloggten User aus dem Channel aus und schließt den Chat.
   * Removes the logged-in user from the channel and closes the chat.
   */
  async leaveChannel() {
    /** success = warte auf: leaveChannel(Channel ID) */
    const success = await this.supabase.leaveChannel(this.channel().id);
    /** wenn (success) dann */
    if (success) {
      /** openPanel = null (Panel schließen) */
      this.openPanel.set(null);
      /** activeChat = null (Chat schließen) */
      this.chatState.activeChat.set(null);
    }
  }

  /**
   * Fügt die ausgewählten User dem Channel hinzu und schließt danach das Panel.
   * Adds the selected users to the channel and then closes the panel.
   */
  async addUsersToChannel() {
    /** userIds = IDs der ausgewählten User */
    const userIds = this.selectedUsers().map(user => user.id);
    /** wenn (niemand ausgewählt) dann beende Funktion */
    if (!userIds.length) return;
    /** isSaving = true (Button sperren gegen Doppelklick) */
    this.isSaving.set(true);
    /** success = warte auf: addChannelMembers(Channel ID, User IDs) */
    const success = await this.supabase.addChannelMembers(this.channel().id, userIds);
    /** isSaving = false (Button wieder freigeben, egal ob Erfolg oder Fehler) */
    this.isSaving.set(false);
    /** wenn (kein success) dann beende Funktion (Auswahl bleibt, man kann es nochmal versuchen) */
    if (!success) return;
    /** selectedUsers = leere Liste (Chips entfernen) */
    this.selectedUsers.set([]);
    /** memberSearch = leer (Suchfeld leeren) */
    this.memberSearch.set('');
    /** openPanel = null (Panel schließen) */
    this.openPanel.set(null);
  }
}
