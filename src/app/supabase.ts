import { Injectable, signal } from '@angular/core';
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

  constructor() {
    this.getUsers();
    this.subscribeToUsers();
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


}
