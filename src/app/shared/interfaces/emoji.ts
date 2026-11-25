export interface Emoji {
/** code = Dateiname ohne .svg (Unicode-Codepoint), z. B. '1f44d' */
    code: string;
    /** char = echtes Emoji-Zeichen für den Nachrichtentext, z. B. '👍' */
    char: string;
    /** name = deutscher Name für alt-Text und Tooltip, z. B. 'Daumen hoch' */
    name: string;
}
