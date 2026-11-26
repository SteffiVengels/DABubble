import { Component, inject, output } from '@angular/core';
import { Supabase } from '../../../supabase';
import { ChatState } from '../../../chat-state';
import { User } from '../../interfaces/user';
import { ChannelHeader } from '../chat/channel-header/channel-header';
import { DmHeader } from '../chat/dm-header/dm-header';
import { MessageList } from '../chat/message-list/message-list';
import { MessageInput } from '../chat/message-input/message-input';

/**
 * Hauptbereich des Messengers: setzt Kopf, Nachrichtenliste und Eingabefeld für Channel oder Direktnachricht zusammen.
 * Main area of the messenger: assembles header, message list and input field for a channel or a direct message.
 * Profil-Klicks werden per (showProfile) an den Messenger gemeldet, dort liegen die Profil-Dialoge.
 * Profile clicks are reported to the messenger via (showProfile), where the profile dialogs live.
 */
@Component({
  selector: 'app-main-chat',
  imports: [ChannelHeader, DmHeader, MessageList, MessageInput],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
  /** chatState = ChatState Service (welcher Chat offen ist) */
  chatState = inject(ChatState);

  /** showProfile = Event an den Messenger: "zeige das Profil von diesem User" (sammelt Klicks aus Kopf, Liste und leerem Chat) */
  showProfile = output<User>();

  /**
   * Sendet einen Text in den aktiven Channel (wird an <app-message-input> übergeben).
   * Sends a text to the active channel (passed to <app-message-input>).
   * Pfeil-Funktion (=>), damit "this" auch dann auf MainChat zeigt, wenn MessageInput die Funktion aufruft.
   * Arrow function (=>) so that "this" still points to MainChat when MessageInput calls the function.
   * @param text - Nachrichtentext / message text
   * @returns true, wenn gespeichert / true if saved
   */
  sendChannelMessage = async (text: string): Promise<boolean> => {
    /** channel = aktuell offener Channel */
    const channel = this.chatState.activeChannel();
    /** wenn (kein Channel offen) dann gib false zurück */
    if (!channel) return false;
    /** gib zurück: warte auf addMessage(Text, Channel ID, keine Gesprächs-ID) */
    return this.supabase.addMessage(text, channel.id, null);
  };

  /**
   * Sendet einen Text als Direktnachricht; legt das Gespräch an, wenn es noch keins gibt (wird an <app-message-input> übergeben).
   * Sends a text as a direct message; creates the conversation if none exists yet (passed to <app-message-input>).
   * @param text - Nachrichtentext / message text
   * @returns true, wenn gespeichert / true if saved
   */
  sendDirectMessage = async (text: string): Promise<boolean> => {
    /** user = aktueller Gesprächspartner */
    const user = this.chatState.activeDirectMessageUser();
    /** wenn (kein Gesprächspartner) dann gib false zurück */
    if (!user) return false;
    /** conversationId = warte auf: getOrCreateConversation(User ID) */
    const conversationId = await this.supabase.getOrCreateConversation(user.id);
    /** wenn (keine conversationId) dann gib false zurück */
    if (!conversationId) return false;
    /** gib zurück: warte auf addMessage(Text, kein Channel, Gesprächs-ID) */
    return this.supabase.addMessage(text, null, conversationId);
  };

  /**
   * Sucht den Namen zu einer User-ID (für den Text im leeren Channel).
   * Looks up the name for a user ID (for the text in an empty channel).
   * @param userId - ID vom gesuchten User / ID of the user to look up
   * @returns Name vom User, sonst 'Unbekannt' / the user's name, otherwise 'Unbekannt'
   */
  getUserName(userId: string) {
    /** gib zurück: suche in users den User mit (user.id ist gleich userId) und nimm seinen Namen, sonst 'Unbekannt' */
    return this.supabase.users().find(user => user.id === userId)?.name ?? 'Unbekannt';
  }
}
