// Splits assistant text into plain strings and links. Only http(s) URLs and email addresses become links;
// everything else, including any HTML the model might emit, stays a string for React to render as text.
export type Part = string | { href: string; text: string };

const TOKEN = /https?:\/\/[^\s<>]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const TRAILING = /[.,;:!?)\]]+$/;

/** Short visible text: a PDF shows its file name ("Kareem_Fakhry_CV.pdf" -> "Kareem Fakhry CV"), else host + path. */
function label(url: URL): string {
  const path = url.pathname.replace(/\/$/, "");
  if (/\.pdf$/i.test(path)) {
    const name = decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
    return name.replace(/\.pdf$/i, "").replaceAll("_", " ");
  }
  return url.host + path;
}

function link(token: string): Part {
  if (!token.startsWith("http")) return { href: `mailto:${token}`, text: token };
  try {
    return { href: token, text: label(new URL(token)) };
  } catch {
    return token;
  }
}

export function linkify(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0].replace(TRAILING, "");
    parts.push(text.slice(last, match.index), link(token));
    last = match.index + token.length;
  }
  parts.push(text.slice(last));
  return parts.filter((p) => p !== "");
}
