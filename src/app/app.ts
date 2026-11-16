import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** title = Signal mit dem Namen der App, Start: 'DABubble' */
  protected readonly title = signal('DABubble');
}
