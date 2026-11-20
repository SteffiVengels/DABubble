/** Interface Message = Aufbau einer Nachricht aus der Tabelle messages */
export interface Message {
    /** id = ID der Nachricht (int8 in Supabase, automatisch vergeben) */
    id: number;
    /** created_at = Zeitpunkt, wann die Nachricht gesendet wurde */
    created_at: string;
    /** sender_id = ID vom User, der die Nachricht geschrieben hat */
    sender_id: string;
    /** content = Nachrichtentext */
    content: string;
    /** channel_id = ID vom Channel, sonst null (bei Direktnachricht) */
    channel_id: number | null;
    /** conversation_id = ID vom Direkt-Gespräch, sonst null (bei Channel-Nachricht) */
    conversation_id: number | null;
    /** parent_id = ID der Hauptnachricht bei einer Thread-Antwort, sonst null */
    parent_id: number | null;
}
