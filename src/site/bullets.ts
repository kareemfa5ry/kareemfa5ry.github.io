// Bullets of an experience or project entry: the front matter `bullets` list. An item is a plain string, or
// { text, cv } to show it only in the listed CV PDFs. One home for the pages, llms.txt and resume.json.
export type CvId = "sda" | "rpm";
export type BulletItem = string | { text: string; cv: CvId[] };

export function bulletText(item: BulletItem): string {
  return typeof item === "string" ? item : item.text;
}

// Every bullet's text, in file order; with a cvId, only the bullets that CV shows.
export function bulletsFor(bullets: BulletItem[], cvId?: CvId): string[] {
  return bullets.filter((item) => !cvId || typeof item === "string" || item.cv.includes(cvId)).map(bulletText);
}

// Display-only typography the Markdown renderer used to apply: curly apostrophes and double quotes.
// llms.txt and resume.json keep the raw text.
export function smartQuotes(text: string): string {
  return text
    .replace(/'/g, "’")
    .replace(/(^|[\s(])"/g, "$1“")
    .replace(/"/g, "”");
}
