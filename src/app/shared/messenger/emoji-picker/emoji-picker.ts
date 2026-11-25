import { Component, output } from '@angular/core';
import { Emoji } from '../../interfaces/emoji';
import { EMOJIS, getEmojiPath } from '../../emojis';

@Component({
  selector: 'app-emoji-picker',
  imports: [],
  templateUrl: './emoji-picker.html',
  styleUrl: './emoji-picker.scss',
})
export class EmojiPicker {
  /** emojis = Liste aller Emojis für den Picker, Start: EMOJIS */
  emojis = EMOJIS;
  /** getEmojiPath = Funktion, die aus dem Code den Bildpfad baut */
  getEmojiPath = getEmojiPath;
  /** emojiSelected = meldet nach außen, welches Emoji geklickt wurde */
  emojiSelected = output<Emoji>();

}
