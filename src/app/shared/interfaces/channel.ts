/** Interface Channel = Aufbau eines Channels aus der Tabelle channels (inkl. Mitglieder aus channel_members) */
export interface Channel {
    /** id = ID vom Channel (int8 in Supabase, automatisch vergeben) */
    id: number;
    /** created_at = Zeitpunkt der Erstellung */
    created_at: string;
    /** name = Name vom Channel (ohne #) */
    name: string;
    /** description = Beschreibung, optional */
    description: string | null;
    /** created_by = ID vom User, der den Channel erstellt hat */
    created_by: string;
    /** memberIds = IDs aller Mitglieder (kommt aus der Tabelle channel_members) */
    memberIds: string[];
}
