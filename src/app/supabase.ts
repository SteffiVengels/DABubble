import { Injectable, signal, computed } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User } from './shared/interfaces/user';
import { environment } from '../environments/environment';

/** Service ist in der ganzen App verfügbar (eine Instanz für alle) */
@Injectable({
  providedIn: 'root',
})
export class Supabase {
  /** supabase = neuer Client (URL, Key aus environment) */
  public supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  /** users = Signal mit Liste von Usern, Start: leere Liste */
  users = signal<User[]>([]);
  /** channel = Realtime-Channel für users-Tabelle, Start: undefined */
  channel: RealtimeChannel | undefined;
  /** currentUserId = Signal mit ID vom eingeloggten User, Start: null */
  currentUserId = signal<string | null>(null);
  /** currentUser = suche in users den User mit (user.id ist gleich currentUserId), sonst null */
  currentUser = computed(() =>
    this.users().find(user => user.id === this.currentUserId()) ?? null
  );

  /** onlineUserIds = Signal mit Menge (Set) von User IDs, die online sind, Start: leer */
  onlineUserIds = signal<Set<string>>(new Set());
  /** presenceChannel = Realtime-Channel für Online-Status, Start: undefined */
  presenceChannel: RealtimeChannel | undefined;
  /** presenceUserId = User ID, für die Presence gerade läuft, Start: null */
  private presenceUserId: string | null = null;

  /** guestEmail = E-Mail vom Gast-Account */
  guestEmail = 'gast@dabubble.de';

  /** directMessageUsers = filtere users */
  directMessageUsers = computed(() =>
    this.users().filter(user =>
      /** behalte User, wenn (E-Mail ist nicht Gast-E-Mail) */
      user.email !== this.guestEmail ||
      /** oder (User ID ist gleich currentUserId) */
      user.id === this.currentUserId() ||
      /** oder (User ID ist in onlineUserIds) */
      this.onlineUserIds().has(user.id)
    )
  );

  /**
   * Abonniert Änderungen an der users-Tabelle und reagiert auf Login, Logout und Account-Wechsel.
   * Subscribes to changes in the users table and reacts to login, logout and account switches.
   */
  constructor() {
    /** führe Funktion subscribeToUsers() aus */
    this.subscribeToUsers();
    /** wenn (Login-Status ändert sich) dann führe aus: */
    this.supabase.auth.onAuthStateChange((_event, session) => {
      /** User ID = ID aus Session, sonst null */
      const userId = session?.user.id ?? null;
      /** currentUserId = User ID */
      this.currentUserId.set(userId);
      /** führe Funktion onUserChanged(User ID) aus, aber erst nach dem Callback (setTimeout) */
      setTimeout(() => this.onUserChanged(userId));
    });
  }

  /**
   * Lädt die User-Liste und startet Presence neu, sobald sich der eingeloggte User ändert (Login, Logout, Account-Wechsel).
   * Reloads the user list and restarts presence whenever the signed-in user changes (login, logout, account switch).
   *
   * @param userId - ID des eingeloggten Users oder `null`, wenn niemand eingeloggt ist. / ID of the signed-in user, or `null` if nobody is signed in.
   */
  private async onUserChanged(userId: string | null) {
    /** wenn (User ID ist gleich aktuelle User ID) dann beende Funktion. */
    if (userId === this.presenceUserId) return;
    /** aktuelle User ID ist User ID */
    this.presenceUserId = userId;
    /** wenn (User ID ist nicht null) führe funktion getUsers() aus */
    if (userId) this.getUsers();
    /** sonst users = leere Liste */
    else this.users.set([]);
    /** warte auf Funktion leavePresence() */
    await this.leavePresence();
    /** wenn (User ID ist nicht null) führe Funktion joinPresence(User ID) aus */
    if (userId) this.joinPresence(userId);
  }

  /**
   * Meldet den gemeinsamen Gast-Account an.
   * Signs in with the shared guest account.
   *
   * @returns Den angemeldeten Gast-User oder `null` bei einem Fehler. / The signed-in guest user, or `null` on error.
   */
  async signInAsGuest() {
    /** gib zurück: Funktion signIn(Gast-E-Mail, Gast-Passwort) */
    return this.signIn(this.guestEmail,'dabubblegast');
  }

  /**
   * Lädt alle User aus der Datenbank und speichert sie im Signal `users`.
   * Loads all users from the database and stores them in the `users` signal.
   */
  async getUsers() {
    /** data, error = warte auf: aus Tabelle users alles auswählen */
    const { data, error } = await this.supabase
      .from('users')
      .select()
    /** wenn (data ist leer) dann */
    if (!data) {
      /** zeige Fehler in Konsole */
      console.error('Error fetching users:', error);
      /** beende Funktion */
      return;
    }
    /** users = data */
    this.users.set(data);
  }

  /**
   * Hört per Realtime auf Änderungen an der users-Tabelle und lädt die User-Liste dann neu.
   * Listens for changes to the users table via Realtime and reloads the user list when one occurs.
   */
  subscribeToUsers() {
    /** channel = neuer Channel 'users' */
    this.channel = this.supabase
      .channel('users')
      /** wenn (Änderung in Tabelle users: einfügen, ändern oder löschen) dann */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        /** warte auf Funktion getUsers() */
        await this.getUsers();
        /** zeige users in Konsole */
        console.log('Change received!', this.users());
      })
      /** Channel starten, dann prüfe Status */
      .subscribe((status, err) => {
        /** wenn (Status ist Fehler oder Zeitüberschreitung) dann */
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          /** zeige Fehler in Konsole */
          console.error(status, err);
        }
      });
  }

  /**
   * Beendet das Realtime-Abo der users-Tabelle.
   * Removes the Realtime subscription for the users table.
   */
  ngOnDestroy() {
    /** wenn (channel ist vorhanden) dann */
    if (this.channel) {
      /** entferne channel */
      this.supabase.removeChannel(this.channel);
    }
  }

  /**
   * Registriert einen neuen Account bei Supabase Auth.
   * Registers a new account with Supabase Auth.
   *
   * @param email - E-Mail-Adresse des neuen Accounts. / Email address of the new account.
   * @param password - Passwort des neuen Accounts. / Password of the new account.
   * @returns Den neuen Auth-User oder `null` bei einem Fehler. / The new auth user, or `null` on error.
   */
  async signUp(email: string, password: string) {
    /** data, error = warte auf: registriere (E-Mail, Passwort) */
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error signing up:', error);
      /** gib null zurück */
      return null;
    }
    /** gib neuen User zurück */
    return data.user;
  }

  /**
   * Meldet einen User mit E-Mail und Passwort an.
   * Signs a user in with email and password.
   *
   * @param email - E-Mail-Adresse. / Email address.
   * @param password - Passwort. / Password.
   * @returns Den angemeldeten Auth-User oder `null` bei einem Fehler. / The signed-in auth user, or `null` on error.
   */
  async signIn(email: string, password: string) {
    /** data, error = warte auf: anmelden mit (E-Mail, Passwort) */
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error signing in:', error);
      /** gib null zurück */
      return null;
    }
    /** gib angemeldeten User zurück */
    return data.user;
  }

  /**
   * Meldet den aktuellen User ab.
   * Signs the current user out.
   */
  async signOut() {
    /** error = warte auf: abmelden */
    const { error } = await this.supabase.auth.signOut();
    /** wenn (error ist vorhanden) zeige Fehler in Konsole */
    if (error) console.error('Error signing out:', error);
  }

  /**
   * Legt das Profil eines neuen Users in der users-Tabelle an.
   * Creates the profile of a new user in the users table.
   *
   * @param user - Profildaten; `id` muss die ID des Auth-Users sein. / Profile data; `id` must be the auth user's ID.
   * @returns Das angelegte Profil oder `null` bei einem Fehler. / The created profile, or `null` on error.
   */
  async addUser(user: Pick<User, 'id' | 'name' | 'email' | 'privacy_policy' | 'avatar'>) {
    /** data, error = warte auf: in Tabelle users den user einfügen und zurückgeben */
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error adding user:', error);
      /** gib null zurück */
      return null;
    }
    /** gib ersten Eintrag aus data zurück */
    return data[0];
  }

  /**
   * Ändert den Namen eines Users in der users-Tabelle.
   * Updates a user's name in the users table.
   *
   * @param userId - ID des Users. / ID of the user.
   * @param name - Der neue Name. / The new name.
   * @returns `true`, wenn der Name geändert wurde, sonst `false`. / `true` if the name was changed, otherwise `false`.
   */
  async updateUserName(userId: string, name: string) {
    /** error = warte auf: in Tabelle users den Namen ändern, wo (id ist gleich User ID) */
    const { error } = await this.supabase
      .from('users')
      .update({ name })
      .eq('id', userId);
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error updating user name:', error);
      /** gib false zurück */
      return false;
    }
    /** users = users, aber beim User mit (id ist gleich User ID) den Namen ersetzen */
    this.users.update(users =>
      users.map(user => user.id === userId ? { ...user, name } : user)
    );
    /** gib true zurück */
    return true;
  }

  /**
   * Schickt eine Mail mit einem Link zum Zurücksetzen des Passworts.
   * Sends an email with a link to reset the password.
   *
   * @param email - E-Mail-Adresse, an die der Link geht. / Email address the link is sent to.
   * @returns `true`, wenn die Mail verschickt wurde, sonst `false`. / `true` if the email was sent, otherwise `false`.
   */
  async sendPasswordResetMail(email: string) {
    /** error = warte auf: schicke Reset-Mail an E-Mail */
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      /** Link in der Mail führt zu: eigene Domain + /auth/new-password */
      redirectTo: `${window.location.origin}/auth/new-password`,
    });
    /** wenn (error ist vorhanden) zeige Fehler in Konsole */
    if (error) console.error('Error sending reset mail:', error);
    /** gib zurück: true, wenn kein error, sonst false */
    return !error;
  }

  /**
   * Prüft über die Datenbank-Funktion `email_exists`, ob eine E-Mail-Adresse schon registriert ist.
   * Checks via the `email_exists` database function whether an email address is already registered.
   *
   * @param email - Zu prüfende E-Mail-Adresse. / Email address to check.
   * @returns `true`, wenn die Adresse vergeben ist, sonst `false`. / `true` if the address is taken, otherwise `false`.
   */
  async emailExists(email: string) {
    /** data, error = warte auf: Datenbank-Funktion email_exists(E-Mail) */
    const { data, error } = await this.supabase.rpc('email_exists', { check_email: email });
    /** wenn (error ist vorhanden) zeige Fehler in Konsole */
    if (error) console.error('Error checking email:', error);
    /** gib zurück: true, wenn (data ist gleich true), sonst false */
    return data === true;
  }


  /**
   * Setzt ein neues Passwort für den eingeloggten User.
   * Sets a new password for the signed-in user.
   *
   * @param password - Das neue Passwort. / The new password.
   * @returns `true`, wenn das Passwort geändert wurde, sonst `false`. / `true` if the password was changed, otherwise `false`.
   */
  async updatePassword(password: string) {
    /** error = warte auf: ändere Passwort vom eingeloggten User */
    const { error } = await this.supabase.auth.updateUser({ password });
    /** wenn (error ist vorhanden) zeige Fehler in Konsole */
    if (error) console.error('Error updating password:', error);
    /** gib zurück: true, wenn kein error, sonst false */
    return !error;
  }

  /**
   * Tritt dem Presence-Channel bei, meldet den User als online und hält `onlineUserIds` aktuell.
   * Joins the presence channel, marks the user as online and keeps `onlineUserIds` up to date.
   *
   * @param userId - ID des eingeloggten Users, dient als Presence-Key. / ID of the signed-in user, used as the presence key.
   */
  private joinPresence(userId: string) {
    /** presenceChannel = neuer Channel 'online-users' mit Key = User ID */
    this.presenceChannel = this.supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    this.presenceChannel
      /** wenn (Online-Liste ändert sich) dann */
      .on('presence', { event: 'sync' }, () => {
        /** state = aktuelle Online-Liste */
        const state = this.presenceChannel!.presenceState();
        /** onlineUserIds = alle Keys (User IDs) aus state */
        this.onlineUserIds.set(new Set(Object.keys(state)));
      })
      /** Channel starten, dann prüfe Status */
      .subscribe(async (status) => {
        /** wenn (Status ist verbunden) dann */
        if (status === 'SUBSCRIBED') {
          /** warte auf: trage mich in Online-Liste ein (mit Zeitpunkt) */
          await this.presenceChannel!.track({ online_at: new Date().toISOString() });
        }
      });
  }

  /**
   * Verlässt den Presence-Channel und leert die Liste der Online-User.
   * Leaves the presence channel and clears the list of online users.
   */
  private async leavePresence() {
    /** wenn (presenceChannel ist nicht vorhanden) dann beende Funktion */
    if (!this.presenceChannel) return;
    /** channel = presenceChannel (zwischenspeichern) */
    const channel = this.presenceChannel;
    /** presenceChannel = undefined */
    this.presenceChannel = undefined;
    /** onlineUserIds = leere Menge */
    this.onlineUserIds.set(new Set());
    /** warte auf: entferne channel */
    await this.supabase.removeChannel(channel);
  }

  /**
   * Prüft, ob ein User gerade online ist.
   * Checks whether a user is currently online.
   *
   * @param userId - ID des Users. / ID of the user.
   * @returns `true`, wenn der User online ist, sonst `false`. / `true` if the user is online, otherwise `false`.
   */
  isOnline(userId: string) {
    /** gib zurück: true, wenn (User ID ist in onlineUserIds), sonst false */
    return this.onlineUserIds().has(userId);
  }


}
