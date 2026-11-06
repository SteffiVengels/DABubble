import { Component, inject } from '@angular/core';
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-workspace-menu',
  imports: [],
  templateUrl: './workspace-menu.html',
  styleUrl: './workspace-menu.scss',
})
export class WorkspaceMenu {
  supabase = inject(Supabase);
}
