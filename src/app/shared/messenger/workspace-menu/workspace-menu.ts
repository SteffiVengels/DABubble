import { Component, inject } from '@angular/core';
import { Supabase } from '../../../supabase';
@Component({
  selector: 'app-workspace-menu',
  imports: [],
  templateUrl: './workspace-menu.html',
  styleUrl: './workspace-menu.scss',
})
export class WorkspaceMenu {
  /** supabase = Supabase Service */
  supabase = inject(Supabase);

  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
    // Ein Klick auf den ::backdrop hat den Dialog selbst als Target
    if (event.target === dialog) dialog.close();
  }

}
