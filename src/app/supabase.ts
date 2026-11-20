import { Injectable, signal, computed } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User } from './shared/interfaces/user';
import { Channel } from './shared/interfaces/channel';
import { environment } from '../environments/environment';
import { Message } from './shared/interfaces/message';
import { DirectConversations } from './shared/interfaces/direct-conversations';

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

  /** channels = Signal mit Liste aller Channels (inkl. memberIds), Start: leere Liste */
  channels = signal<Channel[]>([]);
  /** channelsRealtime = Realtime-Channel für channels- und channel_members-Tabelle, Start: undefined */
  channelsRealtime: RealtimeChannel | undefined;

  /** myChannels = filtere channels */
  myChannels = computed(() =>
    this.channels().filter(channel =>
      /** behalte Channel, wenn (memberIds enthält currentUserId) */
      channel.memberIds.includes(this.currentUserId() ?? '')
    )
  );

  /** messages = Signal mit Liste aller Nachrichten, die der User sehen darf, Start: leere Liste */
  messages = signal<Message[]>([]);
  /** messagesRealtime = Realtime-Channel für messages- und direct_conversations-Tabelle, Start: undefined */
  messagesRealtime: RealtimeChannel | undefined;

  /** directConversations = Signal mit Liste aller eigenen Direkt-Gespräche, Start: leere Liste */
  directConversations = signal<DirectConversations[]>([]);

  /**
   * Abonniert Änderungen an der users-Tabelle und reagiert auf Login, Logout und Account-Wechsel.
   * Subscribes to changes in the users table and reacts to login, logout and account switches.
   */
  constructor() {
    /** führe Funktion subscribeToUsers() aus */
    this.subscribeToUsers();
    /** führe Funktion subscribeToChannels() aus */
    this.subscribeToChannels();
    /** führe Funktion subscribeToMessages() aus */
    this.subscribeToMessages();
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
    /** wenn (User ID ist nicht null) dann */
    if (userId) {
      /** führe Funktion getUsers() aus */
      this.getUsers();
      /** führe Funktion getChannels() aus */
      this.getChannels();
      /** führe Funktion getMessages() aus */
      this.getMessages();
      /** führe Funktion getConversations() aus */
      this.getConversations();
    }
    /** sonst */
    else {
      /** users = leere Liste */
      this.users.set([]);
      /** channels = leere Liste */
      this.channels.set([]);
      /** messages = leere Liste */
      this.messages.set([]);
      /** directConversations = leere Liste */
      this.directConversations.set([]);
    }
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
    return this.signIn(this.guestEmail, 'dabubblegast');
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
   * Lädt alle Channels samt Mitgliedern und speichert sie im Signal `channels`.
   * Loads all channels including their members and stores them in the `channels` signal.
   */
  async getChannels() {
    /** data, error = warte auf: aus Tabelle channels alles auswählen, dazu aus channel_members die user_id, sortiert nach Name */
    const { data, error } = await this.supabase
      .from('channels')
      .select('*, channel_members(user_id)')
      .order('id');
    /** wenn (data ist leer) dann */
    if (!data) {
      /** zeige Fehler in Konsole */
      console.error('Error fetching channels:', error);
      /** beende Funktion */
      return;
    }
    /** channels = data umgewandelt: für jeden Channel */
    this.channels.set(data.map(({ channel_members, ...channel }) => ({
      /** alle Felder vom Channel übernehmen (ohne channel_members) */
      ...channel,
      /** memberIds = aus channel_members nur die user_id nehmen */
      memberIds: (channel_members as { user_id: string }[]).map(member => member.user_id),
    })));
  }

  /**
   * Hört per Realtime auf Änderungen an channels und channel_members und lädt die Channels dann neu.
   * Listens for changes to channels and channel_members via Realtime and reloads the channels when one occurs.
   */
  subscribeToChannels() {
    /** channelsRealtime = neuer Realtime-Channel 'channels' */
    this.channelsRealtime = this.supabase
      .channel('channels')
      /** wenn (Änderung in Tabelle channels) dann führe Funktion getChannels() aus */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => this.getChannels())
      /** wenn (Änderung in Tabelle channel_members) dann führe Funktion getChannels() aus */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_members' }, () => this.getChannels())
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
   * Lädt alle Nachrichten, die der User sehen darf, und speichert sie im Signal `messages`.
   * Loads all messages the user is allowed to see and stores them in the `messages` signal.
   */
  async getMessages() {
    /** data, error = warte auf: aus Tabelle messages alles auswählen, sortiert nach Zeitpunkt */
    const { data, error } = await this.supabase
      .from('messages')
      .select()
      .order('created_at');
    /** wenn (data ist leer) dann */
    if (!data) {
      /** zeige Fehler in Konsole */
      console.error('Error fetching messages:', error);
      /** beende Funktion */
      return;
    }
    /** messages = data */
    this.messages.set(data);
  }

  /**
   * Hört per Realtime auf Änderungen an messages und direct_conversations und lädt die passende Liste neu.
   * Listens for changes to messages and direct_conversations via Realtime and reloads the matching list.
   */
  subscribeToMessages() {
    /** messagesRealtime = neuer Realtime-Channel 'messages' */
    this.messagesRealtime = this.supabase
      .channel('messages')
      /** wenn (Änderung in Tabelle messages) dann führe Funktion getMessages() aus */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => this.getMessages())
      /** wenn (Änderung in Tabelle direct_conversations) dann führe Funktion getConversations() aus */
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, () => this.getConversations())
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
   * Lädt alle eigenen Direkt-Gespräche und speichert sie im Signal `directConversations`.
   * Loads all of the user's direct conversations and stores them in the `directConversations` signal.
   */
  async getConversations() {
    /** data, error = warte auf: aus Tabelle direct_conversations alles auswählen, sortiert nach Zeitpunkt */
    const { data, error } = await this.supabase
      .from('direct_conversations')
      .select()
      .order('created_at');
    /** wenn (data ist leer) dann */
    if (!data) {
      /** zeige Fehler in Konsole */
      console.error('Error fetching conversations:', error);
      /** beende Funktion */
      return;
    }
    /** directConversations = data */
    this.directConversations.set(data);
  }

  /**
   * Beendet die Realtime-Abos der users-, channels- und messages-Tabellen.
   * Removes the Realtime subscriptions for the users, channels and messages tables.
   */
  ngOnDestroy() {
    /** wenn (channel ist vorhanden) dann */
    if (this.channel) {
      /** entferne channel */
      this.supabase.removeChannel(this.channel);
    }
    /** wenn (channelsRealtime ist vorhanden) dann entferne channelsRealtime */
    if (this.channelsRealtime) this.supabase.removeChannel(this.channelsRealtime);
    /** wenn (messagesRealtime ist vorhanden) dann entferne messagesRealtime */
    if (this.messagesRealtime) this.supabase.removeChannel(this.messagesRealtime);
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
   * Ändert den Avatar eines Users in der users-Tabelle.
   * Updates a user's avatar in the users table.
   *
   * @param userId - ID des Users. / ID of the user.
   * @param avatar - Bildpfad vom neuen Avatar. / Image path of the new avatar.
   * @returns `true`, wenn der Avatar geändert wurde, sonst `false`. / `true` if the avatar was changed, otherwise `false`.
   */
  async updateUserAvatar(userId: string, avatar: string) {
    /** error = warte auf: in Tabelle users den Avatar ändern, wo (id ist gleich User ID) */
    const { error } = await this.supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId);
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error updating user avatar:', error);
      /** gib false zurück */
      return false;
    }
    /** users = users, aber beim User mit (id ist gleich User ID) den Avatar ersetzen */
    this.users.update(users =>
      users.map(user => user.id === userId ? { ...user, avatar } : user)
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

    /** presenceChannel einrichten */
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

  /**
   * Legt einen neuen Channel an und trägt die Mitglieder in channel_members ein.
   * Creates a new channel and adds the members to channel_members.
   *
   * @param name - Name vom Channel (ohne #). / Name of the channel (without #).
   * @param description - Beschreibung oder `null`. / Description or `null`.
   * @param memberIds - IDs aller Mitglieder (inkl. Ersteller). / IDs of all members (including the creator).
   * @returns Die ID vom neuen Channel oder `null` bei einem Fehler. / The ID of the new channel, or `null` on error.
   */
  async createChannel(name: string, description: string | null, memberIds: string[]) {
    /** data, error = warte auf: in Tabelle channels (Name, Beschreibung, Ersteller) einfügen und die neue ID zurückgeben */
    const { data, error } = await this.supabase
      .from('channels')
      .insert({ name, description, created_by: this.currentUserId() })
      .select('id')
      .single();
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error creating channel:', error);
      /** gib null zurück */
      return null;
    }
    /** rows = für jede Mitglieds-ID eine Zeile { channel_id, user_id } */
    const rows = memberIds.map(userId => ({ channel_id: data.id, user_id: userId }));
    /** membersError = warte auf: in Tabelle channel_members alle rows einfügen */
    const { error: membersError } = await this.supabase
      .from('channel_members')
      .insert(rows);
    /** wenn (membersError ist vorhanden) dann */
    if (membersError) {
      /** zeige Fehler in Konsole */
      console.error('Error adding channel members:', membersError);
      /** warte auf: Channel wieder löschen, damit kein Channel ohne Mitglieder übrig bleibt */
      await this.supabase.from('channels').delete().eq('id', data.id);
      /** gib null zurück */
      return null;
    }
    /** warte auf: Funktion getChannels() (neuer Channel erscheint sofort, auch ohne Realtime) */
    await this.getChannels();
    /** gib ID vom neuen Channel zurück */
    return data.id as number;
  }

  /**
   * Ändert Name und/oder Beschreibung eines Channels in der channels-Tabelle.
   * Updates the name and/or description of a channel in the channels table.
   *
   * @param channelId - ID des Channels. / ID of the channel.
   * @param changes - Felder, die geändert werden sollen. / Fields to update.
   * @returns `true`, wenn der Channel geändert wurde, sonst `false`. / `true` if the channel was updated, otherwise `false`.
   */
  async updateChannel(channelId: number, changes: { name?: string; description?: string }) {
    /** error = warte auf: in Tabelle channels die Felder aus changes ändern, wo (id ist gleich Channel ID) */
    const { error } = await this.supabase
      .from('channels')
      .update(changes)
      .eq('id', channelId);
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error updating channel:', error);
      /** gib false zurück */
      return false;
    }
    /** channels = channels, aber beim Channel mit (id ist gleich Channel ID) die Felder aus changes ersetzen */
    this.channels.update(channels =>
      channels.map(channel => channel.id === channelId ? { ...channel, ...changes } : channel)
    );
    /** gib true zurück */
    return true;
  }


  /**
   * Trägt den eingeloggten User aus einem Channel aus (löscht seine Zeile in channel_members).
   * Removes the signed-in user from a channel (deletes their row in channel_members).
   *
   * @param channelId - ID des Channels. / ID of the channel.
   * @returns `true`, wenn der User ausgetragen wurde, sonst `false`. / `true` if the user left, otherwise `false`.
   */
  async leaveChannel(channelId: number) {
    /** userId = ID vom eingeloggten User */
    const userId = this.currentUserId();
    /** wenn (kein User eingeloggt) dann gib false zurück */
    if (!userId) return false;
    /** error = warte auf: in Tabelle channel_members die Zeile löschen, wo (channel_id ist Channel ID und user_id ist User ID) */
    const { error } = await this.supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error leaving channel:', error);
      /** gib false zurück */
      return false;
    }
    /** channels = channels, aber beim Channel mit (id ist gleich Channel ID) die eigene ID aus memberIds entfernen */
    this.channels.update(channels =>
      channels.map(channel => channel.id === channelId
        ? { ...channel, memberIds: channel.memberIds.filter(id => id !== userId) }
        : channel)
    );
    /** gib true zurück */
    return true;
  }

  /**
   * Trägt mehrere User als Mitglieder in einen Channel ein (neue Zeilen in channel_members).
   * Adds several users as members to a channel (new rows in channel_members).
   *
   * @param channelId - ID des Channels. / ID of the channel.
   * @param userIds - IDs der User, die hinzugefügt werden. / IDs of the users to add.
   * @returns `true`, wenn die User eingetragen wurden, sonst `false`. / `true` if the users were added, otherwise `false`.
   */
  async addChannelMembers(channelId: number, userIds: string[]) {
    /** rows = für jede User-ID eine Zeile { channel_id, user_id } */
    const rows = userIds.map(userId => ({ channel_id: channelId, user_id: userId }));
    /** error = warte auf: in Tabelle channel_members alle rows auf einmal einfügen */
    const { error } = await this.supabase
      .from('channel_members')
      .insert(rows);
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error adding channel members:', error);
      /** gib false zurück */
      return false;
    }
    /** channels = channels, aber beim Channel mit (id ist gleich Channel ID) die neuen IDs zu memberIds hinzufügen */
    this.channels.update(channels =>
      channels.map(channel => channel.id === channelId
        ? { ...channel, memberIds: [...channel.memberIds, ...userIds] }
        : channel)
    );
    /** gib true zurück */
    return true;
  }

  /**
   * Sucht in der geladenen Liste das Direkt-Gespräch zwischen dem eingeloggten User und einem anderen User.
   * Looks up the direct conversation between the signed-in user and another user in the loaded list.
   *
   * @param otherUserId - ID vom Gesprächspartner. / ID of the conversation partner.
   * @returns Das Gespräch oder `undefined`, wenn es noch keins gibt. / The conversation, or `undefined` if none exists yet.
   */
  findConversation(otherUserId: string) {
    /** myId = ID vom eingeloggten User */
    const myId = this.currentUserId();
    /** gib zurück: suche in directConversations das Gespräch */
    return this.directConversations().find(conv =>
      /** mit (user1 ist ich und user2 ist Gesprächspartner) */
      (conv.user1_id === myId && conv.user2_id === otherUserId) ||
      /** oder (user1 ist Gesprächspartner und user2 ist ich) */
      (conv.user1_id === otherUserId && conv.user2_id === myId)
    );
  }

  /**
   * Sucht das Direkt-Gespräch zwischen dem eingeloggten User und einem anderen User; legt es an, wenn es noch keins gibt.
   * Finds the direct conversation between the signed-in user and another user; creates it if none exists yet.
   *
   * @param otherUserId - ID vom Gesprächspartner. / ID of the conversation partner.
   * @returns Die ID vom Gespräch oder `null` bei einem Fehler. / The ID of the conversation, or `null` on error.
   */
  async getOrCreateConversation(otherUserId: string) {
    /** myId = ID vom eingeloggten User */
    const myId = this.currentUserId();
    /** wenn (kein User eingeloggt) dann gib null zurück */
    if (!myId) return null;
    /** existing = Funktion findConversation(ID vom Gesprächspartner) */
    const existing = this.findConversation(otherUserId);
    /** wenn (Gespräch gefunden) dann gib seine ID zurück */
    if (existing) return existing.id;
    /** data, error = warte auf: in Tabelle direct_conversations (ich, Gesprächspartner) einfügen und die neue ID zurückgeben */
    const { data, error } = await this.supabase
      .from('direct_conversations')
      .insert({ user1_id: myId, user2_id: otherUserId })
      .select('id')
      .single();
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error creating conversation:', error);
      /** gib null zurück */
      return null;
    }
    /** warte auf: Funktion getConversations() (neues Gespräch sofort in der Liste, verhindert doppeltes Anlegen) */
    await this.getConversations();
    /** gib ID vom neuen Gespräch zurück */
    return data.id as number;
  }

  /**
   * Speichert eine neue Nachricht in der messages-Tabelle (in einem Channel oder einem Direkt-Gespräch).
   * Saves a new message to the messages table (in a channel or a direct conversation).
   *
   * @param content - Nachrichtentext. / Message text.
   * @param channelId - ID vom Channel oder `null` bei einer Direktnachricht. / ID of the channel, or `null` for a direct message.
   * @param conversationId - ID vom Gespräch oder `null` bei einer Channel-Nachricht. / ID of the conversation, or `null` for a channel message.
   * @returns `true`, wenn die Nachricht gespeichert wurde, sonst `false`. / `true` if the message was saved, otherwise `false`.
   */
  async addMessage(content: string, channelId: number | null, conversationId: number | null) {
    /** myId = ID vom eingeloggten User */
    const myId = this.currentUserId();
    /** wenn (kein User eingeloggt) dann gib false zurück */
    if (!myId) return false;
    /** error = warte auf: in Tabelle messages die neue Nachricht einfügen */
    const { error } = await this.supabase
      .from('messages')
      .insert({
        /** content = Nachrichtentext */
        content,
        /** sender_id = ich */
        sender_id: myId,
        /** channel_id = Channel ID oder null */
        channel_id: channelId,
        /** conversation_id = Gesprächs-ID oder null */
        conversation_id: conversationId,
      });
    /** wenn (error ist vorhanden) dann */
    if (error) {
      /** zeige Fehler in Konsole */
      console.error('Error sending message:', error);
      /** gib false zurück */
      return false;
    }
    /** warte auf: Funktion getMessages() (neue Nachricht erscheint sofort, auch ohne Realtime) */
    await this.getMessages();
    /** gib true zurück */
    return true;
  }

  

}
