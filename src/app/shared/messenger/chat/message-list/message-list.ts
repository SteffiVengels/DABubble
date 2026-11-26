import { Component, inject, input, output } from '@angular/core';
import { Message } from '../../../interfaces/message';
import { User } from '../../../interfaces/user';
import { MessageItem } from '../message-item/message-item';
import { MessageListState } from './message-list-state';

/**
 * Scrollbare Liste von Nachrichten mit Datums-Trennern.
 * Scrollable list of messages with date separators.
 * Welche Nachrichten gezeigt werden, kommt als Input (Main-Chat: activeMessages, Thread: Antworten).
 * Which messages are shown comes in as an input (main chat: activeMessages, thread: replies).
 * Ist die Liste leer, wird der Inhalt angezeigt, der zwischen <app-message-list> und </app-message-list> steht.
 * If the list is empty, the content placed between <app-message-list> and </app-message-list> is shown.
 */
@Component({
  selector: 'app-message-list',
  imports: [MessageItem],
  /** providers = jede Liste bekommt ihren eigenen MessageListState (siehe message-list-state.ts) */
  providers: [MessageListState],
  templateUrl: './message-list.html',
  styleUrl: './message-list.scss',
  /** wenn (irgendwo im Dokument geklickt wird) dann führe Funktion state.closeAll() aus */
  host: { '(document:click)': 'state.closeAll()' },
})
export class MessageList {
  /** messages = Nachrichten, die angezeigt werden sollen (Pflicht-Input von der Eltern-Komponente) */
  messages = input.required<Message[]>();

  /** showProfile = Event an die Eltern-Komponente: reicht den Klick auf einen Absender-Namen aus MessageItem weiter */
  showProfile = output<User>();

  /** state = gemeinsamer Zustand dieser Liste (offene Menüs / Picker) */
  state = inject(MessageListState);

  /**
   * previousDate = Datum, mit dem die erste Nachricht verglichen wird (Thread: Datum der Hauptnachricht), Start: null.
   * Bei null (Main-Chat) bekommt die erste Nachricht immer einen Trenner.
   */
  previousDate = input<string | Date | null>(null);

  /**
   * Prüft, ob die Nachricht an Position index an einem neuen Tag liegt.
   * DE: Gibt true zurück, wenn vor dieser Nachricht ein Datums-Trenner angezeigt werden soll.
   * EN: Returns true if a date separator should be shown before this message.
   * @param index - Position der Nachricht in messages / position of the message
   * @returns true bei neuem Tag / true on a new day
   */
  isNewDay(index: number): boolean {
    /** hole alle Nachrichten dieser Liste */
    const messages = this.messages();
    /** previousDate = Vergleichsdatum für die erste Nachricht */
    const previousDate = this.previousDate();
    /** wenn (erste Nachricht und kein Vergleichsdatum) dann bekommt sie immer einen Trenner */
    if (index === 0 && previousDate === null) return true;
    /** Datum der aktuellen Nachricht ohne Uhrzeit */
    const current = new Date(messages[index].created_at).toDateString();
    /** Datum davor ohne Uhrzeit: bei der ersten Nachricht previousDate, sonst die vorherige Nachricht */
    const previous = new Date(index === 0 ? previousDate! : messages[index - 1].created_at).toDateString();
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
}
