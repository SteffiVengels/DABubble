import { Component, inject, input, output } from '@angular/core';
import { Supabase } from '../../../../supabase';
import { User } from '../../../interfaces/user';

/**
 * Kopfzeile einer Direktnachricht (Avatar, Online-Status und Name vom Gesprächspartner).
 * Header of a direct message (avatar, online status and name of the conversation partner).
 */
@Component({
  selector: 'app-dm-header',
  imports: [],
  templateUrl: './dm-header.html',
  styleUrl: './dm-header.scss',
})
export class DmHeader {
  /** supabase = Supabase Service (für Online-Status und eigene ID) */
  supabase = inject(Supabase);

  /** user = Gesprächspartner, dessen Kopf angezeigt wird (Pflicht-Input von der Eltern-Komponente) */
  user = input.required<User>();

  /** showProfile = Event an die Eltern-Komponente: "zeige das Profil von diesem User" (Profil-Dialoge liegen in main-chat) */
  showProfile = output<User>();
}
