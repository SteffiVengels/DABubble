import { Component, ElementRef, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-channel-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './create-channel-dialog.html',
  styleUrl: './create-channel-dialog.scss',
})
export class CreateChannelDialog {
  /** dialog = Referenz auf das <dialog>-Element im Template */
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** createChannelForm = Formular mit Channel-Name (Pflicht, min. 3 Zeichen) und Beschreibung (optional) */
  createChannelForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl(''),
  });

  /**
   * Öffnet den Dialog.
   * Opens the dialog.
   */
  open() {
    this.dialog().nativeElement.showModal();
  }

  /**
   * Schließt den Dialog.
   * Closes the dialog.
   */
  close() {
    this.dialog().nativeElement.close();
  }

  /**
   * Schließt den Dialog bei Klick auf den Hintergrund.
   * Closes the dialog when the backdrop is clicked.
   */
  closeOnBackdrop(event: MouseEvent) {
    // Ein Klick auf den ::backdrop hat den Dialog selbst als Target
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
