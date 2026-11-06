import { Injectable, signal, computed } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User } from './shared/interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://dsanjvqpulondqhiubzg.supabase.co';
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzYW5qdnFwdWxvbmRxaGl1YnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODc2OTcsImV4cCI6MjEwNjg2MzY5N30.F3jP0ZMRIgG4irEtfOVPNT7x-m_ZyompFj5dIfSNAR8';
  public supabase = createClient(this.supabaseUrl, this.supabaseKey);

  users = signal<User[]>([]);
  channel: RealtimeChannel | undefined;
  currentUserId = signal<string | null>(null);
  currentUser = computed(() =>
    this.users().find(user => user.id === this.currentUserId()) ?? null
  );

  onlineUserIds = signal<Set<string>>(new Set());
  presenceChannel: RealtimeChannel | undefined;
  private presenceUserId: string | null = null;

  guestEmail = 'gast@dabubble.de';

  directMessageUsers = computed(() =>
    this.users().filter(user =>
      user.email !== this.guestEmail ||
      user.id === this.currentUserId() ||
      this.onlineUserIds().has(user.id)
    )
  );

  constructor() {
    this.getUsers();
    this.subscribeToUsers();
    this.supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      this.currentUserId.set(userId);
      this.updatePresence(userId);
    });
  }

  /** Startet Presence neu, sobald sich der eingeloggte User ändert (Login, Logout, Account-Wechsel). */
  private async updatePresence(userId: string | null) {
    if (userId === this.presenceUserId) return;
    this.presenceUserId = userId;
    await this.leavePresence();
    if (userId) this.joinPresence(userId);
  }

  async signInAsGuest() {
    return this.signIn(this.guestEmail,'dabubblegast');
  }

  async getUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select()
    if (!data) {
      console.error('Error fetching users:', error);
      return;
    }
    this.users.set(data);
  }

  subscribeToUsers() {
    this.channel = this.supabase
      .channel('users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        await this.getUsers();
        console.log('Change received!', this.users());
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(status, err);
        }
      });
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) {
      console.error('Error signing up:', error);
      return null;
    }
    return data.user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Error signing in:', error);
      return null;
    }
    return data.user;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  }

  async addUser(user: Pick<User, 'id' | 'name' | 'email' | 'privacy_policy' | 'avatar'>) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
    if (error) {
      console.error('Error adding user:', error);
      return null;
    }
    return data[0];
  }

  async sendPasswordResetMail(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/new-password`,
    });
    if (error) console.error('Error sending reset mail:', error);
    return !error;
  }

  async emailExists(email: string) {
    const { data } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    return !!data;
  }


  async updatePassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) console.error('Error updating password:', error);
    return !error;
  }

  private joinPresence(userId: string) {
    this.presenceChannel = this.supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel!.presenceState();
        this.onlineUserIds.set(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel!.track({ online_at: new Date().toISOString() });
        }
      });
  }

  private async leavePresence() {
    if (!this.presenceChannel) return;
    const channel = this.presenceChannel;
    this.presenceChannel = undefined;
    this.onlineUserIds.set(new Set());
    await this.supabase.removeChannel(channel);
  }

  isOnline(userId: string) {
    return this.onlineUserIds().has(userId);
  }


}
