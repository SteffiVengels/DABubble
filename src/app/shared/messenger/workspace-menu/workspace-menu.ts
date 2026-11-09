import { Component, inject } from '@angular/core';
import { Supabase } from '../../../supabase';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-workspace-menu',
  imports: [FormsModule, ReactiveFormsModule],
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

  createChannelForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl(''),
  })

}
