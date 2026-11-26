import { Component, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmojiPicker } from '../../emoji-picker/emoji-picker';
import { Emoji } from '../../../interfaces/emoji';

/**
 * Eingabefeld für neue Nachrichten (Channel, Direktnachricht oder später Thread).
 * Input field for new messages (channel, direct message or later thread).
 * Die Komponente weiß nicht, WOHIN gesendet wird – das entscheidet die Eltern-Komponente über sendMessage.
 * The component does not know WHERE the message goes – the parent decides that via sendMessage.
 */
@Component({
  selector: 'app-message-input',
  imports: [ReactiveFormsModule, EmojiPicker],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
  /** wenn (irgendwo im Dokument geklickt wird) dann emojiPickerOpen = false (Picker schließen) */
  host: { '(document:click)': 'emojiPickerOpen.set(false)' },
})
export class MessageInput {
  /** placeholder = Text, der im leeren Eingabefeld steht (kommt von der Eltern-Komponente), Start: leer */
  placeholder = input('');

  /**
   * sendMessage = Funktion von der Eltern-Komponente, die den Text wirklich speichert (Pflicht-Input).
   * Sie bekommt den Text und gibt true (gespeichert) oder false (Fehler) zurück.
   * Darum kein output(): bei einem output() könnten wir nicht abwarten, ob das Senden geklappt hat.
   */
  sendMessage = input.required<(text: string) => Promise<boolean>>();

  /** emojiPickerOpen = ob der Emoji-Picker am Eingabefeld offen ist, Start: false */
  emojiPickerOpen = signal(false);

  /** isSending = ob gerade eine Nachricht gesendet wird (gegen doppeltes Senden), Start: false */
  isSending = signal(false);

  /** messageForm = Formular mit einem Feld für den Nachrichtentext */
  messageForm = new FormGroup({
    /** text = Nachrichtentext, Start: leer, Pflichtfeld und muss mind. ein Zeichen enthalten, das kein Leerzeichen ist */
    text: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
  });

  /**
   * Öffnet oder schließt den Emoji-Picker am Eingabefeld.
   * Opens or closes the emoji picker of the input field.
   */
  toggleEmojiPicker() {
    /** emojiPickerOpen = Gegenteil vom aktuellen Wert (offen → zu, zu → offen) */
    this.emojiPickerOpen.update(open => !open);
  }

  /**
   * Hängt ein Emoji an den Text im Eingabefeld an und schließt den Picker.
   * Appends an emoji to the text in the input field and closes the picker.
   * @param emoji - ausgewähltes Emoji / selected emoji
   */
  addEmoji(emoji: Emoji) {
    /** text = aktueller Text im Eingabefeld, wenn leer dann '' */
    const text = this.messageForm.controls.text.value ?? '';
    /** schreibe (alter Text + Emoji-Zeichen) zurück ins Eingabefeld */
    this.messageForm.controls.text.setValue(text + emoji.char);
    /** emojiPickerOpen = false (Picker schließen) */
    this.emojiPickerOpen.set(false);
  }

  /**
   * Schickt bei Enter das Formular ab; mit Shift + Enter bleibt der normale Zeilenumbruch.
   * On Enter, submits the form; Shift + Enter keeps the normal line break.
   * @param event - Tastatur-Ereignis aus dem Textfeld / keyboard event from the text field
   */
  onEnter(event: Event): void {
    /** keyEvent = Event als Tastatur-Event behandeln */
    const keyEvent = event as KeyboardEvent;
    /** wenn (Shift gedrückt) dann beende Funktion (normaler Zeilenumbruch bleibt) */
    if (keyEvent.shiftKey) return;
    /** Standardverhalten (neue Zeile) unterbinden */
    keyEvent.preventDefault();
    /** Formular vom Textfeld abschicken (löst (ngSubmit) aus, also onSubmit()) */
    (keyEvent.target as HTMLTextAreaElement).form?.requestSubmit();
  }

  /**
   * Sendet den Text über die Funktion der Eltern-Komponente und leert danach das Formular.
   * Sends the text via the parent's function and then clears the form.
   */
  async onSubmit() {
    /** wenn (Formular ungültig oder es wird schon gesendet) dann beende Funktion */
    if (this.messageForm.invalid || this.isSending()) return;
    /** isSending = true (weiteres Senden sperren) */
    this.isSending.set(true);
    /** text = Text aus dem Formular ohne Leerzeichen am Rand */
    const text = this.messageForm.value.text!.trim();
    /** success = warte auf: Sende-Funktion der Eltern-Komponente (text) */
    const success = await this.sendMessage()(text);
    /** wenn (success) dann Formular leeren (bei Fehler bleibt der Text stehen) */
    if (success) this.messageForm.reset();
    /** isSending = false (Senden wieder freigeben, egal ob Erfolg oder Fehler) */
    this.isSending.set(false);
  }
}
