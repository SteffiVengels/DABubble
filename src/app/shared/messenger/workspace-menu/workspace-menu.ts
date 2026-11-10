import { Component, inject } from '@angular/core';
import { Supabase } from '../../../supabase';
import { CreateChannelDialog } from './create-channel-dialog/create-channel-dialog';

@Component({
  selector: 'app-workspace-menu',
  imports: [CreateChannelDialog],
  templateUrl: './workspace-menu.html',
  styleUrl: './workspace-menu.scss',
})
export class WorkspaceMenu {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);
}
