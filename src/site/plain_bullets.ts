// Plain-text bullets of a content entry: the Markdown body's "- " items, wrapped lines joined.
// ponytail: handles flat bullet lists only (all the content uses); add a Markdown parser if bodies grow richer.
export function plainBullets(body: string | undefined): string[] {
  const bullets: string[] = [];
  for (const line of (body ?? "").split("\n")) {
    if (line.startsWith("- ")) bullets.push(line.slice(2).trim());
    else if (line.trim() && bullets.length > 0) bullets[bullets.length - 1] += ` ${line.trim()}`;
  }
  return bullets;
}
