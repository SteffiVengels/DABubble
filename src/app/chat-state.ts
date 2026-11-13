import { Injectable, computed, inject, signal } from '@angular/core';
import { Supabase } from './supabase';

/**
 * ActiveChat = beschreibt, welcher Chat gerade offen ist.
 * Entweder ein Channel (mit channelId) oder eine Direktnachricht (mit userId).
 *
 * ActiveChat = describes which chat is currently open.
 * Either a channel (with channelId) or a direct message (with userId).
 */
export type ActiveChat =
  /** Channel-Chat: type ist 'channel', dazu die ID vom Channel */
  | { type: 'channel'; channelId: number }
  /** Direktnachricht: type ist 'directMessage', dazu die ID vom Gesprächspartner */
  | { type: 'directMessage'; userId: string };

/**
 * Hält den Zustand, welcher Chat offen ist – geteilt zwischen allen Komponenten.
 * Holds the state of which chat is open – shared between all components.
 */
/** Service ist in der ganzen App verfügbar (eine Instanz für alle) */
@Injectable({
  providedIn: 'root',
})
export class ChatState {
  /** supabase = Supabase Service (für users und channels) */
  private supabase = inject(Supabase);

  /** activeChat = Signal mit dem aktuell offenen Chat, Start: null (kein Chat offen) */
  activeChat = signal<ActiveChat | null>(null);
  /** previousChat = Signal mit dem zuletzt offenen Chat, Start: null */
  previousChat = signal<ActiveChat | null>(null);

  /** activeChatType = Typ vom aktiven Chat ('channel' / 'directMessage'), sonst null */
  activeChatType = computed(() => this.activeChat()?.type ?? null);

  /** activeChannel = suche in channels den Channel mit (channel.id ist gleich aktiver channelId), sonst null */
  activeChannel = computed(() => {
    /** chat = aktueller Chat */
    const chat = this.activeChat();
    /** wenn kein Channel-Chat offen, dann null zurückgeben */
    if (chat?.type !== 'channel') return null;
    /** sonst den passenden Channel aus der Liste zurückgeben, sonst null */
    return this.supabase.channels().find(channel => channel.id === chat.channelId) ?? null;
  });

  /** activeDirectMessageUser = suche in users den User mit (user.id ist gleich aktiver userId), sonst null */
  activeDirectMessageUser = computed(() => {
    /** chat = aktueller Chat */
    const chat = this.activeChat();
    /** wenn keine Direktnachricht offen, dann null zurückgeben */
    if (chat?.type !== 'directMessage') return null;
    /** sonst den passenden User aus der Liste zurückgeben, sonst null */
    return this.supabase.users().find(user => user.id === chat.userId) ?? null;
  });

  /**
   * Öffnet einen Channel-Chat.
   * Opens a channel chat.
   * @param channelId - ID vom Channel / ID of the channel
   */
  openChannel(channelId: number) {
    /** openChat mit (type 'channel', channelId) aufrufen */
    this.openChat({ type: 'channel', channelId });
  }

  /**
   * Öffnet eine Direktnachricht mit einem User.
   * Opens a direct message with a user.
   * @param userId - ID vom Gesprächspartner / ID of the conversation partner
   */
  openDirectMessage(userId: string) {
    /** openChat mit (type 'directMessage', userId) aufrufen */
    this.openChat({ type: 'directMessage', userId });
  }

  /**
   * Wechselt zurück zum zuletzt offenen Chat.
   * Switches back to the previously open chat.
   */
  goBack() {
    /** last = zuletzt offener Chat */
    const last = this.previousChat();
    /** wenn es keinen gibt, abbrechen */
    if (!last) return;
    /** sonst diesen Chat öffnen */
    this.openChat(last);
  }

  /**
   * Setzt den aktiven Chat und merkt sich den vorherigen.
   * Sets the active chat and remembers the previous one.
   * @param chat - der neue Chat / the new chat
   */
  private openChat(chat: ActiveChat) {
    /** current = aktuell offener Chat */
    const current = this.activeChat();
    /** wenn der gleiche Chat schon offen ist, abbrechen (sonst wäre previousChat = aktueller Chat) */
    if (current && this.isSameChat(current, chat)) return;
    /** previousChat = aktuell offener Chat */
    this.previousChat.set(current);
    /** activeChat = neuer Chat */
    this.activeChat.set(chat);
  }

  /**
   * Prüft, ob zwei Chats derselbe sind.
   * Checks whether two chats are the same.
   * @param a - erster Chat / first chat
   * @param b - zweiter Chat / second chat
   * @returns true, wenn gleich / true if equal
   */
  private isSameChat(a: ActiveChat, b: ActiveChat): boolean {
    /** wenn beide Channels sind, dann channelIds vergleichen */
    if (a.type === 'channel' && b.type === 'channel') return a.channelId === b.channelId;
    /** wenn beide Direktnachrichten sind, dann userIds vergleichen */
    if (a.type === 'directMessage' && b.type === 'directMessage') return a.userId === b.userId;
    /** sonst unterschiedlicher Typ, also nicht gleich */
    return false;
  }
}
