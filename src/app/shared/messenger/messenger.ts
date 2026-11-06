import { Component, inject } from '@angular/core';
import { WorkspaceMenu } from './workspace-menu/workspace-menu';
import { MainChat } from './main-chat/main-chat';
import { SecondaryChat } from './secondary-chat/secondary-chat';
import { Supabase } from '../../supabase';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-messenger',
  imports: [WorkspaceMenu, MainChat, SecondaryChat, RouterLink],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss',
})
export class Messenger {
  isOpen = true;
  supabase = inject(Supabase);

}
