import { Component,input, output, signal } from '@angular/core';

@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {
  name = input('');
  goBack = output<void>();
  avatarChosen = output<string>();

  avatars = [
    '/img/women2.png', '/img/men1.png', '/img/men2.png',
    '/img/men3.png', '/img/women1.png', '/img/men4.png',
  ];
  selectedAvatar = signal('/img/person.png');

  confirmAvatar() {
    this.avatarChosen.emit(this.selectedAvatar());
  }
}
