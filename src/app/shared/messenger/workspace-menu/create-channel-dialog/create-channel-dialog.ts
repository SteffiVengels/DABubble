import { Component, ElementRef, viewChild, signal, inject, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../../../supabase';
import { User } from '../../../interfaces/user';

/** Komponente = Dialog zum Erstellen eines neuen Channels (Schritt 1: Name/Beschreibung, Schritt 2: Mitglieder) */
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
    /** name = Channel-Name, Start: leer, Pflichtfeld, mindestens 3 Zeichen */
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    /** description = Beschreibung, Start: leer, optional */
    description: new FormControl(''),
  });

  /** step = aktueller Schritt im Dialog ('form' = Name eingeben, 'members' = Leute hinzufügen), Start: 'form' */
  step = signal<'form' | 'members'>('form');

  /** memberMode = Auswahl im Radio ('all' = alle von Devspace, 'specific' = bestimmte Leute), Start: 'all' */
  memberMode = signal<'all' | 'specific'>('all');
  /** supabase = Supabase Service */
  supabase = inject(Supabase);

  /** memberSearch = Text im Suchfeld "Name eingeben", Start: leer */
  memberSearch = signal('');
  /** selectedUsers = ausgewählte User für den neuen Channel, Start: leere Liste */
  selectedUsers = signal<User[]>([]);
  /** isSaving = ob gerade gespeichert wird (Button sperren gegen Doppelklick), Start: false */
  isSaving = signal(false);
  /** saveError = ob beim Speichern ein Fehler kam (Meldung anzeigen), Start: false */
  saveError = signal(false);

  /** filteredUsers = User, die zum Suchtext passen und noch nicht ausgewählt sind */
  filteredUsers = computed(() => {
    /** term = Suchtext ohne Leerzeichen am Rand, in Kleinbuchstaben */
    const term = this.memberSearch().trim().toLowerCase();
    /** selectedIds = IDs der schon ausgewählten User */
    const selectedIds = this.selectedUsers().map(user => user.id);
    /** gib zurück: filtere directMessageUsers */
    return this.supabase.directMessageUsers().filter(user =>
      /** behalte User, wenn (nicht ich selbst, Ersteller ist automatisch Mitglied) */
      user.id !== this.supabase.currentUserId() &&
      /** und (noch nicht ausgewählt) */
      !selectedIds.includes(user.id) &&
      /** und (Name in Kleinbuchstaben enthält den Suchtext) */
      user.name.toLowerCase().includes(term)
    );
  });

  /**
   * Öffnet den Dialog.
   * Opens the dialog.
   */
  open() {
    /** zeige Dialog als Modal an (mit Hintergrund, Rest der Seite gesperrt) */
    this.dialog().nativeElement.showModal();
  }

  /**
   * Schließt den Dialog.
   * Closes the dialog.
   */
  close() {
    /** schließe Dialog (löst (close)-Event aus, das ruft reset() auf) */
    this.dialog().nativeElement.close();
  }

  /**
   * Schließt den Dialog bei Klick auf den Hintergrund.
   * Closes the dialog when the backdrop is clicked.
   */
  closeOnBackdrop(event: MouseEvent) {
    /** wenn (geklicktes Element ist der Dialog selbst, also der ::backdrop) dann schließe Dialog */
    if (event.target === this.dialog().nativeElement) this.close();
  }

  /**
   * Wechselt zu Schritt 2 (Leute hinzufügen), wenn das Formular gültig ist.
   * Switches to step 2 (add people) if the form is valid.
   */
  goToMembers() {
    /** wenn (Formular ist ungültig) dann beende Funktion */
    if (this.createChannelForm.invalid) return;
    /** step = 'members' */
    this.step.set('members');
  }

  /**
   * Speichert den Suchtext aus dem Input-Feld.
   * Stores the search text from the input field.
   */
  onMemberSearch(event: Event) {
    /** memberSearch = Wert aus dem Input-Feld (event.target als Input-Element behandeln) */
    this.memberSearch.set((event.target as HTMLInputElement).value);
  }

  /**
   * Fügt einen User zur Auswahl hinzu und leert das Suchfeld.
   * Adds a user to the selection and clears the search field.
   */
  addUser(user: User) {
    /** selectedUsers = neue Liste aus (alte Liste + User) */
    this.selectedUsers.update(list => [...list, user]);
    /** memberSearch = leer (Suchfeld leeren, Ergebnisliste schließt sich) */
    this.memberSearch.set('');
  }

  /**
   * Entfernt einen User aus der Auswahl.
   * Removes a user from the selection.
   */
  removeUser(user: User) {
    /** selectedUsers = filtere Liste, behalte alle außer (ID ist gleich User ID) */
    this.selectedUsers.update(list => list.filter(selected => selected.id !== user.id));
  }

  /**
   * Sammelt die IDs aller Mitglieder, abhängig von der Radio-Auswahl. Der Ersteller ist immer dabei.
   * Collects the IDs of all members depending on the radio choice. The creator is always included.
   *
   * @returns Liste von User IDs ohne Duplikate. / List of user IDs without duplicates.
   */
  getMemberIds() {
    /** ids = leere Menge (Set speichert jede ID nur einmal, Duplikate fallen automatisch weg) */
    const ids = new Set<string>();
    /** myId = ID vom eingeloggten User */
    const myId = this.supabase.currentUserId();
    /** wenn (myId ist vorhanden) dann füge myId hinzu (Ersteller ist immer Mitglied) */
    if (myId) ids.add(myId);
    /** wenn (memberMode ist 'all') dann */
    if (this.memberMode() === 'all') {
      /** für jeden User aus users: wenn (E-Mail ist nicht Gast-E-Mail) dann füge User ID hinzu */
      this.supabase.users().forEach(user => {
        if (user.email !== this.supabase.guestEmail) ids.add(user.id);
      });
    }
    /** sonst (memberMode ist 'specific') */
    else {
      /** für jeden ausgewählten User: füge User ID hinzu */
      this.selectedUsers().forEach(user => ids.add(user.id));
    }
    /** gib zurück: Set als Array */
    return [...ids];
  }

  /**
   * Speichert den neuen Channel samt Mitgliedern in Supabase und schließt danach den Dialog.
   * Saves the new channel with its members to Supabase and closes the dialog afterwards.
   */
  async createChannel() {
    /** wenn (Formular ist ungültig oder es wird schon gespeichert) dann beende Funktion */
    if (this.createChannelForm.invalid || this.isSaving()) return;
    /** wenn (memberMode ist 'specific' und niemand ausgewählt) dann beende Funktion */
    if (this.memberMode() === 'specific' && !this.selectedUsers().length) return;
    /** isSaving = true (Button sperren) */
    this.isSaving.set(true);
    /** saveError = false (alte Fehlermeldung ausblenden) */
    this.saveError.set(false);
    /** name = Channel-Name aus dem Formular ohne Leerzeichen am Rand */
    const name = this.createChannelForm.value.name!.trim();
    /** description = Beschreibung ohne Leerzeichen am Rand, wenn leer dann null */
    const description = this.createChannelForm.value.description?.trim() || null;
    /** channelId = warte auf: Funktion createChannel(Name, Beschreibung, Mitglieds-IDs) im Service */
    const channelId = await this.supabase.createChannel(name, description, this.getMemberIds());
    /** isSaving = false (Button wieder freigeben) */
    this.isSaving.set(false);
    /** wenn (channelId ist null, also Fehler) dann zeige Fehlermeldung und beende Funktion */
    if (channelId === null) {
      this.saveError.set(true);
      return;
    }
    /** schließe Dialog (reset() wird dabei automatisch aufgerufen) */
    this.close();
  }

  /**
   * Setzt den Dialog auf den Anfangszustand zurück (wird beim Schließen aufgerufen).
   * Resets the dialog to its initial state (called when it closes).
   */
  reset() {
    /** step = 'form' (wieder bei Schritt 1 starten) */
    this.step.set('form');
    /** Formular leeren */
    this.createChannelForm.reset();
    /** memberMode = 'all' */
    this.memberMode.set('all');
    /** memberSearch = leer */
    this.memberSearch.set('');
    /** selectedUsers = leere Liste */
    this.selectedUsers.set([]);
    /** saveError = false */
    this.saveError.set(false);
  }
}
