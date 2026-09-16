import { Component, output } from '@angular/core';

@Component({
  selector: 'app-choose-avatar',
  imports: [],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {
  goBack = output<void>();
}
