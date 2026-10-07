import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://dsanjvqpulondqhiubzg.supabase.co';
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzYW5qdnFwdWxvbmRxaGl1YnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODc2OTcsImV4cCI6MjEwNjg2MzY5N30.F3jP0ZMRIgG4irEtfOVPNT7x-m_ZyompFj5dIfSNAR8';
  public supabase = createClient(this.supabaseUrl, this.supabaseKey);

  users = signal<{ id: number; created_at: string; name: string; email: string, password: string, privacy_policy: boolean, avatar: string, online: boolean }[]>([])
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

  async addUser(user: { name: string; email: string; password: string; privacy_policy: boolean }) {
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

}
