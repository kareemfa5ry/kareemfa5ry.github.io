// Split a sentence into plain text and glossary-term parts, for the tap-to-explain terms.
export type Part = { text: string } | { term: string; meaning: string };
type Entry = { term: string; meaning: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Acronyms (no lowercase letter) match exactly; other terms match in any case. Whole words only.
// "Booking class (RBD)" is looked up as "Booking class".
function finder(term: string): RegExp {
  const word = term.replace(/\s*\(.*\)$/, "");
  const flags = word === word.toUpperCase() ? "u" : "iu";
  return new RegExp(`(?<![\\p{L}\\p{N}])${escape(word)}(?![\\p{L}\\p{N}])`, flags);
}

// First hit per term; where two hits overlap the earlier (then the longer) one wins.
export function splitTerms(text: string, glossary: readonly Entry[]): Part[] {
  const hits = glossary
    .map((entry) => ({ entry, m: finder(entry.term).exec(text) }))
    .flatMap(({ entry, m }) => (m ? [{ entry, start: m.index, end: m.index + m[0].length }] : []))
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const parts: Part[] = [];
  let at = 0;
  for (const { entry, start, end } of hits) {
    if (start < at) continue;
    if (start > at) parts.push({ text: text.slice(at, start) });
    parts.push({ term: text.slice(start, end), meaning: entry.meaning });
    at = end;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  return parts;
}
