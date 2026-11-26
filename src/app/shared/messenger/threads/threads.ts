import { Component, inject, output } from '@angular/core';
import { Supabase } from '../../../supabase';
import { ChatState } from '../../../chat-state';
import { User } from '../../interfaces/user';
import { MessageItem } from '../chat/message-item/message-item';
import { MessageList } from '../chat/message-list/message-list';
import { MessageListState } from '../chat/message-list/message-list-state';
import { MessageInput } from '../chat/message-input/message-input';

@Component({
  selector: 'app-threads',
  imports: [MessageItem, MessageList, MessageInput],
  providers: [MessageListState],
  templateUrl: './threads.html',
  styleUrl: './threads.scss',
  host: { '(document:click)': 'state.closeAll()' },
})
export class Threads {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** chatState = ChatState Service (welcher Thread offen ist) */
  chatState = inject(ChatState);
  /** state = Zustand für die Hauptnachricht oben (offene Menüs / Picker) */
  state = inject(MessageListState);

  /** showProfile = Event an den Messenger: "zeige das Profil von diesem User" */
  showProfile = output<User>();

  /**
   * Sendet eine Antwort in den offenen Thread (wird an <app-message-input> übergeben).
   * Sends a reply to the open thread (passed to <app-message-input>).
   * @param text - Nachrichtentext / message text
   * @returns true, wenn gespeichert / true if saved
   */
  sendReply = async (text: string): Promise<boolean> => {
    /** parent = Hauptnachricht vom offenen Thread */
    const parent = this.chatState.threadParent();
    /** wenn (kein Thread offen) dann gib false zurück */
    if (!parent) return false;
    /** gib zurück: warte auf addMessage(Text, Channel-ID und Gesprächs-ID der Hauptnachricht, Hauptnachrichten-ID) */
    return this.supabase.addMessage(text, parent.channel_id, parent.conversation_id, parent.id);
  };

}
