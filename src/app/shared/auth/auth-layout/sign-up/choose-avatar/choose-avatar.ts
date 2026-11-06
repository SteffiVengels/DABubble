import { Component,input, output, signal } from '@angular/core';

@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {
  /** name = Eingabe von Eltern-Komponente, Start: leerer Text */
  name = input('');
  /** goBack = Ereignis an Eltern-Komponente: zurück zum Formular */
  goBack = output<void>();
  /** avatarChosen = Ereignis an Eltern-Komponente: Avatar gewählt (mit Bildpfad) */
  avatarChosen = output<string>();

  /** avatars = Liste der Bildpfade zur Auswahl */
  avatars = [
    '/img/women2.png', '/img/men1.png', '/img/men2.png',
    '/img/men3.png', '/img/women1.png', '/img/men4.png',
  ];
  /** selectedAvatar = Signal mit gewähltem Bild, Start: Platzhalter-Bild */
  selectedAvatar = signal('/img/person.png');

  /**
   * Gibt den ausgewählten Avatar an die Eltern-Komponente weiter.
   * Passes the selected avatar to the parent component.
   */
  confirmAvatar() {
    /** sende avatarChosen mit selectedAvatar */
    this.avatarChosen.emit(this.selectedAvatar());
  }
}
