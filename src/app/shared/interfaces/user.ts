/** Interface User = Aufbau eines Users aus der Tabelle users */
export interface User {
    /** id = ID vom User (gleich wie ID in Supabase Auth) */
    id: string;
    /** created_at = Zeitpunkt der Erstellung */
    created_at: string;
    /** name = angezeigter Name */
    name: string;
    /** email = E-Mail-Adresse */
    email: string;
    /** privacy_policy = ob Datenschutz akzeptiert wurde */
    privacy_policy: boolean;
    /** avatar = Bildpfad vom Profilbild */
    avatar: string;
}
