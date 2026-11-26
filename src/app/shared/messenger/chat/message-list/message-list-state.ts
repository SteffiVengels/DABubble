import { Injectable, signal } from '@angular/core';

/**
 * Gemeinsamer Zustand aller Nachrichten EINER Nachrichtenliste (welches Menü / welcher Picker gerade offen ist).
 * Shared state of all messages in ONE message list (which menu / picker is currently open).
 *
 * Kein providedIn: 'root' → jede MessageList bekommt über "providers" ihre eigene Instanz.
 * Dadurch stören sich Main-Chat und Thread nicht gegenseitig.
 * No providedIn: 'root' → every MessageList gets its own instance via "providers",
 * so the main chat and the thread don't interfere with each other.
 */
@Injectable()
export class MessageListState {
  /** openOptionsId = ID der Nachricht, deren Options-Menü offen ist, Start: null (keins) */
  openOptionsId = signal<number | null>(null);

  /** reactionPickerId = ID der Nachricht, deren Reaktions-Picker offen ist, Start: null (keiner) */
  reactionPickerId = signal<number | null>(null);

  /** reactionPickerBelow = ob der Reaktions-Picker nach unten aufgehen soll (oben zu wenig Platz), Start: false */
  reactionPickerBelow = signal(false);

  /** reactionPickerSource = wo der Reaktions-Picker geöffnet wurde: 'bar' (Reaktions-Leiste) oder 'reactions' (unter der Nachricht), Start: 'bar' */
  reactionPickerSource = signal<'bar' | 'reactions'>('bar');

  /** editMessageId = ID der Nachricht, die gerade bearbeitet wird, Start: null (keine) */
  editMessageId = signal<number | null>(null);

  /** editEmojiPickerOpen = ob der Emoji-Picker im Bearbeiten-Feld offen ist, Start: false */
  editEmojiPickerOpen = signal(false);

  /**
   * Prüft, ob der Reaktions-Picker einer Nachricht an einer bestimmten Stelle offen ist.
   * Checks whether the reaction picker of a message is open at a specific place.
   * @param messageId - ID der Nachricht / ID of the message
   * @param source - 'bar' oder 'reactions' / 'bar' or 'reactions'
   * @returns true, wenn offen / true if open
   */
  isReactionPickerOpen(messageId: number, source: 'bar' | 'reactions'): boolean {
    /** gib zurück: (Picker-ID ist gleich Nachrichten-ID) und (Quelle ist gleich source) */
    return this.reactionPickerId() === messageId && this.reactionPickerSource() === source;
  }

  /**
   * Schließt alle offenen Menüs und Picker der Liste (bei Klick irgendwo ins Dokument).
   * Closes all open menus and pickers of the list (on a click anywhere in the document).
   */
  closeAll() {
    /** openOptionsId = null (kein Options-Menü offen) */
    this.openOptionsId.set(null);
    /** editEmojiPickerOpen = false (Emoji-Picker im Bearbeiten-Feld schließen) */
    this.editEmojiPickerOpen.set(false);
    /** reactionPickerId = null (Reaktions-Picker schließen) */
    this.reactionPickerId.set(null);
  }
}
