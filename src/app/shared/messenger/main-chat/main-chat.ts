import { Component, inject, signal, computed, ElementRef, viewChild } from '@angular/core';
import { Supabase } from '../../../supabase';
import { ChatState } from '../../../chat-state';
import { User } from '../../interfaces/user';
import { ProfileDialog } from '../profile-dialog/profile-dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Message } from '../../interfaces/message';


@Component({
  selector: 'app-main-chat',
  imports: [ProfileDialog, ReactiveFormsModule, DatePipe],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
  /** wenn (irgendwo im Dokument geklickt wird) dann führe Funktion closeOptions() aus */
  host: { '(document:click)': 'closeOptions()' },
})
export class MainChat {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** chatState = ChatState Service (welcher Chat offen ist) */
  chatState = inject(ChatState);

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

  /** dialog = Referenz auf das <dialog>-Element im Template (Profil anderer User) */
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** selectedUser = User, dessen Profil im Dialog gezeigt wird, Start: null */
  selectedUser = signal<User | null>(null);
  /** isSaving = ob gerade gespeichert wird (Button sperren gegen Doppelklick), Start: false */
  isSaving = signal(false);

  /** isSending = ob gerade eine Nachricht gesendet wird (gegen doppeltes Senden), Start: false */
  isSending = signal(false);

  /** openOptionsId = Signal mit ID der Nachricht, deren Options-Menü offen ist, Start: null (keins) */
  openOptionsId = signal<number | null>(null);

  editMessage = signal(false);

  editMessageId = signal<number | null>(null);

  editMessageInput = signal('');

  /** ownProfileDialog = Referenz auf die ProfileDialog-Komponente (eigenes Profil mit Bearbeiten) */
  ownProfileDialog = viewChild.required(ProfileDialog);

  /** messageForm = Formular mit einem Feld für den Nachrichtentext */
  messageForm = new FormGroup({
    /** text = Nachrichtentext, Start: leer, Pflichtfeld und muss mind. ein Zeichen enthalten, das kein Leerzeichen ist */
    text: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
  });

  /**
 * Prüft, ob die Nachricht an Position index an einem neuen Tag liegt.
 * DE: Gibt true zurück, wenn vor dieser Nachricht ein Datums-Trenner angezeigt werden soll.
 * EN: Returns true if a date separator should be shown before this message.
 * @param index - Position der Nachricht in activeMessages / position of the message
 * @returns true bei neuem Tag / true on a new day
 */
  isNewDay(index: number): boolean {
    /** hole alle Nachrichten des aktiven Chats */
    const messages = this.chatState.activeMessages();
    /** erste Nachricht bekommt immer einen Trenner */
    if (index === 0) return true;
    /** Datum der aktuellen Nachricht ohne Uhrzeit */
    const current = new Date(messages[index].created_at).toDateString();
    /** Datum der vorherigen Nachricht ohne Uhrzeit */
    const previous = new Date(messages[index - 1].created_at).toDateString();
    /** neuer Tag, wenn die beiden Daten verschieden sind */
    return current !== previous;
  }

  /**
   * Erzeugt den Text für den Datums-Trenner.
   * DE: Gibt "Heute", "Gestern" oder z. B. "Montag, 23. November" zurück.
   * EN: Returns "Heute", "Gestern" or e.g. "Montag, 23. November".
   * @param date - Zeitstempel der Nachricht / message timestamp
   * @returns Anzeigetext / label text
   */
  getDateLabel(date: string | Date): string {
    /** Datum der Nachricht ohne Uhrzeit */
    const day = new Date(date).toDateString();
    /** heutiges Datum ohne Uhrzeit */
    const today = new Date().toDateString();
    /** gestriges Datum berechnen */
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    /** wenn heute, dann "Heute" */
    if (day === today) return 'Heute';
    /** wenn gestern, dann "Gestern" */
    if (day === yesterday) return 'Gestern';
    /** sonst Wochentag, Tag und Monat auf Deutsch */
    return new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  }


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
   * Sucht den User zu einer User-ID (z. B. für Name und Avatar vom Absender einer Nachricht).
   * Looks up the user for a user ID (e.g. for the name and avatar of a message's sender).
   * @param userId - ID vom gesuchten User / ID of the user to look up
   * @returns den User, sonst null / the user, otherwise null
   */
  getUser(userId: string) {
    /** gib zurück: suche in users den User mit (user.id ist gleich userId), sonst null */
    return this.supabase.users().find(user => user.id === userId) ?? null;
  }

  /**
   * Öffnet oder schließt das Options-Menü einer Nachricht.
   * Opens or closes the options menu of a message.
   * @param messageId - ID der Nachricht / ID of the message
   */
  toggleOptions(messageId: number) {
    /** openOptionsId = wenn (Menü dieser Nachricht schon offen) dann null, sonst messageId */
    this.openOptionsId.update(id => id === messageId ? null : messageId);
  }

  showEditMessage(message: Message) {
    /** editMessage = true (Bearbeiten-Modus an) */
    this.editMessage.set(true);
    /** editMessageId = ID der Nachricht */
    this.editMessageId.set(message.id);
    /** editMessageInput = Text der Nachricht */
    this.editMessageInput.set(message.content);
  }

  cancelEditMessage() {
    this.editMessage.set(false);
    this.editMessageId.set(null);
    this.editMessageInput.set('');
  }

  /**
   * Schließt das offene Options-Menü.
   * Closes the open options menu.
   */
  closeOptions() {
    /** openOptionsId = null (kein Menü offen) */
    this.openOptionsId.set(null);
  }

  /** channelMembers = alle User, die Mitglied im aktiven Channel sind */
  channelMembers = computed(() => {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** wenn (kein Channel offen) dann gib leere Liste zurück */
    if (!channel) return [];
    /** gib zurück: filtere users, behalte User, wenn (memberIds vom Channel enthält User ID) */
    return this.supabase.users().filter(user => channel.memberIds.includes(user.id));
  });

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

  /** filteredUsers = User, die zum Suchtext passen und noch nicht ausgewählt sind */
  filteredUsers = computed(() => {
    /** term = Suchtext ohne Leerzeichen am Rand, in Kleinbuchstaben */
    const term = this.memberSearch().trim().toLowerCase();
    /** selectedIds = IDs der schon ausgewählten User */
    const selectedIds = this.selectedUsers().map(user => user.id);
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** memberIds = IDs der Channel-Mitglieder, sonst leere Liste */
    const memberIds = channel?.memberIds ?? [];
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
   * Speichert den neuen Channel-Namen in Supabase und beendet den Bearbeiten-Modus.
   * Saves the new channel name to Supabase and ends edit mode.
   */
  async saveChannelName() {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** name = Inhalt vom Input ohne Leerzeichen am Rand */
    const name = this.channelNameInput().trim();
    /** wenn (kein Channel oder Name ist leer) dann beende Funktion */
    if (!channel || !name) return;
    /** success = warte auf: updateChannel(Channel ID, neuer Name) */
    const success = await this.supabase.updateChannel(channel.id, { name });
    /** wenn (success) dann editingChannelName = false (Bearbeiten-Modus beenden) */
    if (success) this.editingChannelName.set(false);
  }


  /**
   * Speichert die neue Channel-Beschreibung in Supabase und beendet den Bearbeiten-Modus.
   * Saves the new channel description to Supabase and ends edit mode.
   */
  async saveChannelDescription() {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** description = Inhalt vom Input ohne Leerzeichen am Rand */
    const description = this.channelDescriptionInput().trim();
    /** wenn (kein Channel oder Beschreibung ist leer) dann beende Funktion */
    if (!channel || !description) return;
    /** success = warte auf: updateChannel(Channel ID, neue Beschreibung) */
    const success = await this.supabase.updateChannel(channel.id, { description });
    /** wenn (success) dann editingChannelDescription = false (Bearbeiten-Modus beenden) */
    if (success) this.editingChannelDescription.set(false);
  }

  async saveEditMessage(message: Message) {
    /** content = Text aus dem Bearbeiten-Feld, ohne Leerzeichen am Anfang und Ende */
    const content = this.editMessageInput().trim();
    /** wenn (content ist leer) dann beende Funktion */
    if (!content) return;
    /** success = warte auf Funktion updateMessage(Nachrichten-ID, content) */
    const success = await this.supabase.updateMessage(message.id, content);
    /** wenn (success) dann führe Funktion cancelEditMessage() aus (Bearbeiten-Modus aus) */
    if (success) this.cancelEditMessage();
  }


  /**
   * Trägt den eingeloggten User aus dem aktiven Channel aus und schließt den Chat.
   * Removes the logged-in user from the active channel and closes the chat.
   */
  async leaveChannel() {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** wenn (kein Channel offen) dann beende Funktion */
    if (!channel) return;
    /** success = warte auf: leaveChannel(Channel ID) */
    const success = await this.supabase.leaveChannel(channel.id);
    /** wenn (success) dann */
    if (success) {
      /** openPanel = null (Panel schließen) */
      this.openPanel.set(null);
      /** activeChat = null (Chat schließen) */
      this.chatState.activeChat.set(null);
    }
  }

  /**
   * Öffnet das Profil eines Users: das eigene (kein Gast) bearbeitbar, alle anderen nur zum Ansehen.
   * Opens a user's profile: your own (not guest) editable, all others read-only.
   * @param user - angeklickter User / clicked user
   */
  showUserProfile(user: User) {
    /** Mitglieder-Panel bleibt offen, damit man nach dem Schließen des Profils weiter in der Liste ist */
    /** wenn (User ist eingeloggter User und kein Gast) dann */
    if (this.isOwnEditableProfile(user)) {
      /** ProfileDialog öffnen (zeigt currentUser mit Bearbeiten) */
      this.ownProfileDialog().open();
      /** beende Funktion */
      return;
    }
    /** selectedUser = übergebener User */
    this.selectedUser.set(user);
    /** Dialog öffnen */
    this.dialog().nativeElement.showModal();
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
   * Schließt den Profil-Dialog.
   * Closes the profile dialog.
   */
  close() {
    /** Dialog schließen */
    this.dialog().nativeElement.close();
  }

  /**
   * Schließt Profil-Dialoge und Panels und öffnet die Direktnachricht mit dem User.
   * Closes profile dialogs and panels and opens the direct message with the user.
   * @param userId - ID vom Gesprächspartner / ID of the conversation partner
   */
  openMessage(userId: string) {
    /** Profil-Dialog (anderer User) schließen */
    this.close();
    /** eigenen Profil-Dialog schließen */
    this.ownProfileDialog().close();
    /** openPanel = null (Mitglieder-Panel schließen) */
    this.openPanel.set(null);
    /** Direktnachricht mit User öffnen */
    this.chatState.openDirectMessage(userId);
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

  /**
   * Fügt die ausgewählten User dem aktiven Channel hinzu und zeigt danach die Mitgliederliste.
   * Adds the selected users to the active channel and then shows the member list.
   */
  async addUsersToChannel() {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** userIds = IDs der ausgewählten User */
    const userIds = this.selectedUsers().map(user => user.id);
    /** wenn (kein Channel oder niemand ausgewählt) dann beende Funktion */
    if (!channel || !userIds.length) return;
    /** isSaving = true (Button sperren gegen Doppelklick) */
    this.isSaving.set(true);
    /** success = warte auf: addChannelMembers(Channel ID, User IDs) */
    const success = await this.supabase.addChannelMembers(channel.id, userIds);
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

  /**
   * Schickt bei Enter das Formular ab, in dem das Textfeld steckt; mit Shift + Enter bleibt der normale Zeilenumbruch.
   * On Enter, submits the form containing the text field; Shift + Enter keeps the normal line break.
   * @param event - Tastatur-Ereignis aus dem Textfeld / keyboard event from the text field
   */
  onEnter(event: Event): void {
    /** keyEvent = Event als Tastatur-Event behandeln */
    const keyEvent = event as KeyboardEvent;
    /** wenn (Shift gedrückt) dann beende Funktion (normaler Zeilenumbruch bleibt) */
    if (keyEvent.shiftKey) return;
    /** Standardverhalten (neue Zeile) unterbinden */
    keyEvent.preventDefault();
    /** Formular vom Textfeld abschicken (löst (ngSubmit) aus, also die passende Sende-Funktion) */
    (keyEvent.target as HTMLTextAreaElement).form?.requestSubmit();
  }

  /**
   * Sendet die Nachricht in einen Channel.
   * Sends the message to a channel.
   * @param channelId - ID vom Channel / ID of the channel
   */
  async sendChannelMessage(channelId: number) {
    /** wenn (Senden nicht möglich) dann beende Funktion */
    if (!this.canSend()) return;
    /** isSending = true (weiteres Senden sperren) */
    this.isSending.set(true);
    /** warte auf: saveMessage(Channel ID, keine Gesprächs-ID) */
    await this.saveMessage(channelId, null);
    /** isSending = false (Senden wieder freigeben) */
    this.isSending.set(false);
  }

  /**
   * Sendet die Nachricht als Direktnachricht; legt das Gespräch an, wenn es noch keins gibt.
   * Sends the message as a direct message; creates the conversation if none exists yet.
   * @param userId - ID vom Gesprächspartner / ID of the conversation partner
   */
  async sendDirectMessage(userId: string) {
    /** wenn (Senden nicht möglich) dann beende Funktion */
    if (!this.canSend()) return;
    /** isSending = true (schon vor dem Gespräch-Anlegen sperren, sonst entstehen evtl. zwei Gespräche) */
    this.isSending.set(true);
    /** conversationId = warte auf: getOrCreateConversation(User ID) */
    const conversationId = await this.supabase.getOrCreateConversation(userId);
    /** wenn (conversationId vorhanden) dann warte auf: saveMessage(kein Channel, Gesprächs-ID) */
    if (conversationId) await this.saveMessage(null, conversationId);
    /** isSending = false (Senden wieder freigeben, egal ob Erfolg oder Fehler) */
    this.isSending.set(false);
  }

  /**
   * Prüft, ob gerade gesendet werden darf.
   * Checks whether sending is currently allowed.
   * @returns true, wenn das Formular gültig ist und nicht schon gesendet wird / true if the form is valid and nothing is being sent
   */
  private canSend() {
    /** gib zurück: (Formular ist gültig) und (es wird nicht schon gesendet) */
    return this.messageForm.valid && !this.isSending();
  }

  /**
   * Speichert den Text aus dem Formular als Nachricht und leert danach das Formular.
   * Saves the text from the form as a message and then clears the form.
   * @param channelId - ID vom Channel oder null / ID of the channel, or null
   * @param conversationId - ID vom Gespräch oder null / ID of the conversation, or null
   */
  private async saveMessage(channelId: number | null, conversationId: number | null) {
    /** text = Text aus dem Formular ohne Leerzeichen am Rand */
    const text = this.messageForm.value.text!.trim();
    /** success = warte auf: addMessage(Text, Channel ID, Gesprächs-ID) */
    const success = await this.supabase.addMessage(text, channelId, conversationId);
    /** wenn (success) dann Formular leeren */
    if (success) this.messageForm.reset();
  }

}
