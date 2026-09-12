/**
 * Display-name safety (applies to heroName/displayName at the update boundary).
 * - Allowed: unicode letters/numbers plus space . ' ’ - _ (no HTML, no control chars).
 * - Compact blocklist matched on whole words only (avoids "Scunthorpe" false hits).
 * No dependency — small, auditable, and strict enough for exported Hero Cards.
 */

const SAFE_CHARS = /^[\p{L}\p{N} _.'’\-]{1,80}$/u;

// Unambiguous English profanities/slurs kept as whole-word matches; deliberately
// short — obvious evasions with symbols are already rejected by SAFE_CHARS.
const BLOCKED = new Set(
  "fuck fucking fucker shit bitch slut whore cunt dick cock pussy porn porno hentai rape rapist nazi hitler faggot nigger nigga retard chink spic kike anal boob boobs tits titty viagra casino pornographic xxx nudes nude".split(
    " ",
  ),
);

export function nameError(value: string): string | null {
  const name = value.trim();
  if (name.length === 0) return "Name can't be blank.";
  if (name.length > 80) return "Keep names to 80 characters.";
  if (!SAFE_CHARS.test(name)) return "Letters, numbers, spaces and . ' - _ only.";
  const words = name.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/);
  if (words.some((w) => BLOCKED.has(w))) return "That name isn't allowed here — pick another hero name.";
  return null;
}
