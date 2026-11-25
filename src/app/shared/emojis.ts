/** importiere Bauplan Emoji aus dem Ordner interfaces */
import { Emoji } from './interfaces/emoji';

/** EMOJI_FOLDER = Ordner, in dem alle Emoji-Bilder liegen (public/img/emojis) */
export const EMOJI_FOLDER = '/img/emojis/';

/** EMOJIS = Liste aller Emojis für den Picker, sortiert nach Gruppen (Reihenfolge = Anzeige im Picker) */
export const EMOJIS: Emoji[] = [
    /** Gruppe 1: Gesichter */
    { code: '1f642', char: '🙂', name: 'Lächeln' },
    { code: '1f60a', char: '😊', name: 'Freundliches Lächeln' },
    { code: '1f602', char: '😂', name: 'Tränen lachen' },
    { code: '1f605', char: '😅', name: 'Verlegen lachen' },
    { code: '1f914', char: '🤔', name: 'Nachdenken' },
    { code: '1f913', char: '🤓', name: 'Streber' },
    { code: '1f970', char: '🥰', name: 'Verliebt' },
    { code: '2639', char: '☹️', name: 'Traurig' },

    /** Gruppe 2: Gesten */
    { code: '1f44d', char: '👍', name: 'Daumen hoch' },
    { code: '1f44e', char: '👎', name: 'Daumen runter' },
    { code: '1f44c', char: '👌', name: 'Passt' },
    { code: '1f44f', char: '👏', name: 'Applaus' },
    { code: '1f64f', char: '🙏', name: 'Danke' },
    { code: '1f91d', char: '🤝', name: 'Handschlag' },
    { code: '1f44b', char: '👋', name: 'Winken' },
    { code: '1f440', char: '👀', name: 'Schaue ich mir an' },

    /** Gruppe 3: Symbole */
    { code: '2705', char: '✅', name: 'Erledigt' },
    { code: '274c', char: '❌', name: 'Nein' },
    { code: '2753', char: '❓', name: 'Frage' },
    { code: '2757', char: '❗', name: 'Wichtig' },
    { code: '26a0', char: '⚠️', name: 'Achtung' },
    { code: '2764', char: '❤️', name: 'Herz' },
    { code: '1f4af', char: '💯', name: 'Hundert Prozent' },
    { code: '1f525', char: '🔥', name: 'Feuer' },

    /** Gruppe 4: Dinge & Aktivitäten */
    { code: '1f389', char: '🎉', name: 'Feiern' },
    { code: '1f680', char: '🚀', name: 'Rakete' },
    { code: '1f4a1', char: '💡', name: 'Idee' },
    { code: '1f4cc', char: '📌', name: 'Wichtig angepinnt' },
    { code: '1f4c5', char: '📅', name: 'Termin' },
    { code: '23f0', char: '⏰', name: 'Erinnerung' },
    { code: '2615', char: '☕', name: 'Kaffeepause' },
    { code: '1f3dd', char: '🏝️', name: 'Urlaub' },
];

/**
 * Baut aus dem Code eines Emojis den Pfad zum Bild.
 * Builds the image path from an emoji's code.
 * @param code Dateiname ohne .svg, z. B. '1f44d' / file name without .svg, e.g. '1f44d'
 * @returns Pfad zum Bild, z. B. '/img/emojis/1f44d.svg' / path to the image
 */
export function getEmojiPath(code: string): string {
    /** gib zurück: Ordner + Code + '.svg' */
    return EMOJI_FOLDER + code + '.svg';
}
