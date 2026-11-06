import { Component, input } from '@angular/core';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  /** text = Eingabe von Eltern-Komponente: angezeigter Text, Start: leer */
  text = input('');
  /** icon = Eingabe von Eltern-Komponente: Bildpfad vom Icon, Start: leer */
  icon = input('');

}
