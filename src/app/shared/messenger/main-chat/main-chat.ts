import { Component, inject, signal } from '@angular/core';
import { Supabase } from '../../../supabase';
import { ChatState } from '../../../chat-state';

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

}
