import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Supabase } from '../../../../supabase';
import { Message } from '../../../interfaces/message';
import { User } from '../../../interfaces/user';
import { Emoji } from '../../../interfaces/emoji';
import { ReactionGroup } from '../../../interfaces/reaction';
import { getEmojiPath } from '../../../emojis';
import { EmojiPicker } from '../../emoji-picker/emoji-picker';
import { MessageListState } from '../message-list/message-list-state';

/**
 * Eine einzelne Nachricht mit Reaktionen, Reaktions-Leiste, Options-Menü und Bearbeiten-Modus.
 * A single message with reactions, reaction bar, options menu and edit mode.
 * Muss innerhalb einer MessageList stehen (braucht deren MessageListState).
 * Must be placed inside a MessageList (needs its MessageListState).
 */
@Component({
  selector: 'app-message-item',
  imports: [DatePipe, EmojiPicker],
  templateUrl: './message-item.html',
  styleUrl: './message-item.scss',
})
export class MessageItem {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** state = gemeinsamer Zustand der Liste, in der diese Nachricht steht */
  state = inject(MessageListState);

  /** message = die Nachricht, die angezeigt wird (Pflicht-Input von MessageList) */
  message = input.required<Message>();

  /** showProfile = Event an MessageList: "zeige das Profil von diesem User" (wird bis zu main-chat weitergereicht) */
  showProfile = output<User>();

  /** editMessageInput = aktueller Text im Bearbeiten-Feld, Start: leer */
  editMessageInput = signal('');

  /** getEmojiPath = Funktion, die aus dem Code den Bildpfad baut */
  getEmojiPath = getEmojiPath;

  /** sender = User, der die Nachricht geschrieben hat, sonst null */
  sender = computed(() => {
    /** senderId = ID vom Absender der Nachricht */
    const senderId = this.message().sender_id;
    /** gib zurück: suche in users den User mit (user.id ist gleich senderId), sonst null */
    return this.supabase.users().find(user => user.id === senderId) ?? null;
  });

  /** isOwn = ob die Nachricht vom eingeloggten User ist */
  isOwn = computed(() => this.message().sender_id === this.supabase.currentUserId());

  /** isEditing = ob genau diese Nachricht gerade bearbeitet wird */
  isEditing = computed(() => this.state.editMessageId() === this.message().id);

  /** isAnyEditing = ob irgendeine Nachricht der Liste gerade bearbeitet wird (dann Reaktions-Leisten ausblenden) */
  isAnyEditing = computed(() => this.state.editMessageId() !== null);

  /**
   * Die zwei zuletzt von mir genutzten Emojis für die Reaktions-Leiste, aufgefüllt mit ✅ und 👍.
   * The two emojis I used most recently for the reaction bar, filled up with ✅ and 👍.
   * computed = wird nur neu berechnet, wenn sich reactions() oder currentUserId() ändert
   */
  recentEmojis = computed(() => {
    /** myReactions = filtere alle Reaktionen, behalte Reaktion, wenn (user_id ist gleich meine ID) */
    const myReactions = this.supabase.reactions().filter(reaction => reaction.user_id === this.supabase.currentUserId());
    /** codes = leere Liste für die Emoji-Codes */
    const codes: string[] = [];
    /** für jede Reaktion in myReactions, von hinten (neueste zuerst) */
    for (let i = myReactions.length - 1; i >= 0; i--) {
      /** code = Emoji-Code der Reaktion */
      const code = myReactions[i].emoji_code;
      /** wenn (code noch nicht in codes) dann code zu codes hinzufügen */
      if (!codes.includes(code)) codes.push(code);
      /** wenn (2 Codes gefunden) dann Schleife beenden */
      if (codes.length === 2) break;
    }
    /** für jeden Standard-Code: ✅ (2705) und 👍 (1f44d) */
    for (const fallback of ['2705', '1f44d']) {
      /** wenn (weniger als 2 Codes) und (Standard-Code noch nicht in codes) dann hinzufügen */
      if (codes.length < 2 && !codes.includes(fallback)) codes.push(fallback);
    }
    /** gib codes zurück */
    return codes;
  });

  /**
   * Reaktionen dieser Nachricht, zusammengefasst pro Emoji (früher getMessageReactions(message.id)).
   * Reactions of this message, grouped per emoji (formerly getMessageReactions(message.id)).
   * computed = wird nur neu berechnet, wenn sich reactions(), die Nachricht oder currentUserId() ändert
   */
  reactionGroups = computed(() => {
    /** messageId = ID dieser Nachricht */
    const messageId = this.message().id;
    /** reactions = filtere alle Reaktionen, behalte Reaktion, wenn (message_id ist gleich Nachrichten-ID) */
    const reactions = this.supabase.reactions().filter(reaction => reaction.message_id === messageId);
    /** groups = leere Liste für die zusammengefassten Reaktionen */
    const groups: ReactionGroup[] = [];
    /** für jede Reaktion in reactions */
    for (const reaction of reactions) {
      /** group = suche in groups das Kästchen, wo (code ist gleich emoji_code der Reaktion), sonst undefined */
      let group = groups.find(g => g.code === reaction.emoji_code);
      /** wenn (kein Kästchen gefunden) dann */
      if (!group) {
        /** group = neues Kästchen mit diesem Emoji, Anzahl 0, nicht von mir, noch keine User */
        group = { code: reaction.emoji_code, count: 0, reactedByMe: false, userIds: [] };
        /** füge neues Kästchen zu groups hinzu */
        groups.push(group);
      }
      /** count vom Kästchen um 1 erhöhen */
      group.count++;
      /** füge User-ID der Reaktion zu userIds vom Kästchen hinzu */
      group.userIds.push(reaction.user_id);
      /** wenn (Reaktion ist von mir) dann reactedByMe = true */
      if (reaction.user_id === this.supabase.currentUserId()) group.reactedByMe = true;
    }
    /** gib groups zurück */
    return groups;
  });

  /**
   * Baut die Namen für den Reaktions-Tooltip, z. B. "Sofia Müller und Du".
   * Builds the names for the reaction tooltip, e.g. "Sofia Müller und Du".
   * @param group - Reaktions-Gruppe / reaction group
   * @returns Namen als Text / names as text
   */
  getReactionNames(group: ReactionGroup): string {
    /** names = für jede User-ID (außer meiner) den Namen holen, sonst 'Unbekannt' */
    const names = group.userIds
      .filter(id => id !== this.supabase.currentUserId())
      .map(id => this.supabase.users().find(user => user.id === id)?.name ?? 'Unbekannt');
    /** wenn (ich habe reagiert) dann 'Du' ans Ende anhängen */
    if (group.reactedByMe) names.push('Du');
    /** wenn (nur ein Name) dann diesen zurückgeben */
    if (names.length === 1) return names[0];
    /** gib zurück: alle Namen außer dem letzten mit Komma, dann 'und' + letzter Name */
    return names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1];
  }

  /**
   * Gibt das passende Verb für den Reaktions-Tooltip zurück.
   * Returns the matching verb for the reaction tooltip.
   * @param group - Reaktions-Gruppe / reaction group
   * @returns 'hast reagiert', 'hat reagiert' oder 'haben reagiert'
   */
  getReactionVerb(group: ReactionGroup): string {
    /** wenn (mehr als eine Person) dann 'haben reagiert' */
    if (group.count > 1) return 'haben reagiert';
    /** wenn (nur ich) dann 'hast reagiert', sonst 'hat reagiert' */
    return group.reactedByMe ? 'hast reagiert' : 'hat reagiert';
  }

  /**
   * Meldet nach oben, dass das Profil vom Absender geöffnet werden soll.
   * Tells the parent that the sender's profile should be opened.
   */
  openSenderProfile() {
    /** user = Absender der Nachricht */
    const user = this.sender();
    /** wenn (Absender gefunden) dann sende Event showProfile mit dem Absender */
    if (user) this.showProfile.emit(user);
  }

  /**
   * Öffnet oder schließt das Options-Menü dieser Nachricht.
   * Opens or closes the options menu of this message.
   */
  toggleOptions() {
    /** messageId = ID dieser Nachricht */
    const messageId = this.message().id;
    /** openOptionsId = wenn (Menü dieser Nachricht schon offen) dann null, sonst messageId */
    this.state.openOptionsId.update(id => id === messageId ? null : messageId);
  }

  /**
   * Öffnet oder schließt den Reaktions-Picker dieser Nachricht und prüft, ob er nach oben oder unten aufgehen soll.
   * Opens or closes the reaction picker of this message and checks whether it should open upwards or downwards.
   * @param event - Klick-Ereignis vom Emoji-Button / click event from the emoji button
   * @param source - wo geklickt wurde: 'bar' oder 'reactions' / where it was clicked: 'bar' or 'reactions'
   */
  toggleReactionPicker(event: MouseEvent, source: 'bar' | 'reactions' = 'bar') {
    /** messageId = ID dieser Nachricht */
    const messageId = this.message().id;
    /** button = Button, auf den geklickt wurde */
    const button = event.currentTarget as HTMLElement;
    /** list = Nachrichtenliste, in der der Button steckt (die schneidet den Picker oben ab) */
    const list = button.closest('.messages-wrapper');
    /** listTop = oberer Rand der Liste im Fenster, wenn keine Liste gefunden dann 0 */
    const listTop = list ? list.getBoundingClientRect().top : 0;
    /** spaceAbove = Platz zwischen oberem Rand der Liste und Button */
    const spaceAbove = button.getBoundingClientRect().top - listTop;
    /** reactionPickerBelow = wenn (Platz oben kleiner als 250px) dann true, sonst false */
    this.state.reactionPickerBelow.set(spaceAbove < 250);
    /** alreadyOpen = ob der Picker dieser Nachricht an genau dieser Stelle schon offen ist */
    const alreadyOpen = this.state.isReactionPickerOpen(messageId, source);
    /** reactionPickerSource = source (merken, wo der Picker aufgehen soll) */
    this.state.reactionPickerSource.set(source);
    /** reactionPickerId = wenn (schon offen) dann null (schließen), sonst messageId (öffnen) */
    this.state.reactionPickerId.set(alreadyOpen ? null : messageId);
  }

  /**
   * Setzt die im Picker gewählte Reaktion und schließt den Picker.
   * Sets the reaction chosen in the picker and closes the picker.
   * @param emoji - ausgewähltes Emoji / selected emoji
   */
  addReactionFromPicker(emoji: Emoji) {
    /** führe Funktion toggleReaction(Nachrichten-ID, Code vom Emoji) aus */
    this.supabase.toggleReaction(this.message().id, emoji.code);
    /** reactionPickerId = null (Picker schließen) */
    this.state.reactionPickerId.set(null);
  }

  /**
   * Startet den Bearbeiten-Modus für diese Nachricht.
   * Starts edit mode for this message.
   */
  showEditMessage() {
    /** editMessageId = ID dieser Nachricht (Bearbeiten-Modus an, alle anderen Nachrichten merken es über state) */
    this.state.editMessageId.set(this.message().id);
    /** editMessageInput = Text der Nachricht */
    this.editMessageInput.set(this.message().content);
  }

  /**
   * Beendet den Bearbeiten-Modus, ohne zu speichern.
   * Ends edit mode without saving.
   */
  cancelEditMessage() {
    /** editMessageId = null (keine Nachricht wird bearbeitet) */
    this.state.editMessageId.set(null);
    /** editMessageInput = leer */
    this.editMessageInput.set('');
  }

  /**
   * Öffnet oder schließt den Emoji-Picker im Bearbeiten-Feld.
   * Opens or closes the emoji picker in the edit field.
   */
  toggleEditEmojiPicker() {
    /** editEmojiPickerOpen = Gegenteil vom aktuellen Wert */
    this.state.editEmojiPickerOpen.update(open => !open);
  }

  /**
   * Hängt ein Emoji an den Text im Bearbeiten-Feld an und schließt den Picker.
   * Appends an emoji to the text in the edit field and closes the picker.
   * @param emoji - ausgewähltes Emoji / selected emoji
   */
  addEmojiToEdit(emoji: Emoji) {
    /** editMessageInput = alter Text + Emoji-Zeichen */
    this.editMessageInput.update(text => text + emoji.char);
    /** editEmojiPickerOpen = false (Picker schließen) */
    this.state.editEmojiPickerOpen.set(false);
  }

  /**
   * Speichert den geänderten Text in Supabase und beendet den Bearbeiten-Modus.
   * Saves the changed text to Supabase and ends edit mode.
   */
  async saveEditMessage() {
    /** content = Text aus dem Bearbeiten-Feld, ohne Leerzeichen am Anfang und Ende */
    const content = this.editMessageInput().trim();
    /** wenn (content ist leer) dann beende Funktion */
    if (!content) return;
    /** success = warte auf Funktion updateMessage(Nachrichten-ID, content) */
    const success = await this.supabase.updateMessage(this.message().id, content);
    /** wenn (success) dann führe Funktion cancelEditMessage() aus (Bearbeiten-Modus aus) */
    if (success) this.cancelEditMessage();
  }
}
