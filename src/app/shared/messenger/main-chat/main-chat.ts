import { Component } from '@angular/core';

@Component({
  selector: 'app-main-chat',
  imports: [],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat {

  /**
   * Schließt den Dialog bei Klick auf den Hintergrund.
   * Closes the dialog when the backdrop is clicked.
   */
  closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement) {
    // Ein Klick auf den ::backdrop hat den Dialog selbst als Target
    if (event.target === dialog) dialog.close();
  }

}
