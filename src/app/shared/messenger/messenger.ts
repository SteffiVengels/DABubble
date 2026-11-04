import { Component } from '@angular/core';
import { WorkspaceMenu } from './workspace-menu/workspace-menu';
import { MainChat } from './main-chat/main-chat';
import { SecondaryChat } from './secondary-chat/secondary-chat';

@Component({
  selector: 'app-messenger',
  imports: [WorkspaceMenu, MainChat, SecondaryChat],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss',
})
export class Messenger {
  isOpen = true;

}
