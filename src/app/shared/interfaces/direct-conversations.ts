/** Interface DirectConversations = Aufbau eines Direkt-Gesprächs aus der Tabelle direct_conversations */
export interface DirectConversations {
    /** id = ID vom Gespräch (int8 in Supabase, automatisch vergeben) */
    id: number;
    /** created_at = Zeitpunkt der Erstellung */
    created_at: string;
    /** user1_id = ID vom ersten User (der das Gespräch angelegt hat) */
    user1_id: string;
    /** user2_id = ID vom zweiten User (Gesprächspartner) */
    user2_id: string;
}
