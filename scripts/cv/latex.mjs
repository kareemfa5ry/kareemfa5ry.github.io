// LaTeX text for the CV .tex files: escaping and the section writers. Pure functions, no file access.
const SPECIAL = {
  "\\": "\\textbackslash{}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};
const UNICODE = { "–": "--", "—": "---", "·": "\\textperiodcentered{}", "×": "\\texttimes{}" };

// One regex pass over the special characters, so nothing is escaped twice; the Unicode map runs after it
// (its output holds backslashes). Any other non-ASCII character stops the run, naming where it came from.
export function escapeTex(text, where = "text") {
  const escaped = text.replace(/[\\&%$#_{}~^]/g, (c) => SPECIAL[c] ?? `\\${c}`);
  const mapped = escaped.replace(/[–—·×]/g, (c) => UNICODE[c]);
  const bad = mapped.match(/[^\t\n -~]/u);
  if (bad) {
    const code = bad[0].codePointAt(0).toString(16);
    throw new Error(`cv: ${where}: character ${JSON.stringify(bad[0])} (U+${code}) has no LaTeX mapping`);
  }
  return mapped;
}

const DOT = "\\textperiodcentered{}";
const items = (lines, where) => [
  "\\begin{itemize}",
  ...lines.map((line) => `  \\item ${escapeTex(line, where)}`),
  "\\end{itemize}",
];

export function headerBlock({ name, headline, location, email, linkedinLabel, linkedinUrl }, where) {
  const sep = "\\enspace\\textperiodcentered\\enspace";
  const e = (t) => escapeTex(t, where);
  return [
    `{\\LARGE\\bfseries ${e(name.toUpperCase())}}\\par\\vspace{3pt}`,
    `{\\color{muted}${e(headline)}}\\par\\vspace{3pt}`,
    `{\\small\\color{muted}${e(location)} \\ifx\\cvphone\\empty\\else${sep} \\cvphone\\ \\fi${sep} ` +
      `\\href{mailto:${email}}{${e(email)}} ${sep} \\href{${linkedinUrl}}{${e(linkedinLabel)}}}\\par\\vspace{2pt}`,
    "{\\color{rule}\\rule{\\linewidth}{0.6pt}}",
  ].join("\n");
}

export const profileBlock = (summary, where) => `\\section{Profile}\n${escapeTex(summary, where)}\\par`;

export function skillsBlock(groups) {
  const lines = groups.map(
    ({ data, id }) =>
      `\\textbf{${escapeTex(data.label, id)}:} ${escapeTex(data.items.join(", "), id)}\\par\\vspace{1pt}`,
  );
  return ["\\section{Skills}", ...lines].join("\n");
}

export function roleBlock({ id, data }, bullets, monthLabel) {
  const { title, org, location, start, end, note } = data;
  const dates = `${monthLabel(start)} -- ${end ? monthLabel(end) : "Present"}`;
  const e = (t) => escapeTex(t, id);
  const head = title
    ? `\\role{${e(title)}}{${e(org)}}{${e(location)} ${DOT} ${dates}}`
    : `\\role{${e(org)}}{${e(location)}}{${dates}}`;
  return [head, ...(note ? [`\\rolenote{${e(note)}}`] : []), ...items(bullets, id)].join("\n");
}

export function projectBlock({ id, data }, bullets) {
  const { title, org, period, stack } = data;
  const e = (t) => escapeTex(t, id);
  const where = period ? `${org}, ${period}` : org;
  return [`\\project{${e(title)}}{${e(where)}}`, ...items(bullets, id), `\\stack{${e(stack.join(", "))}}`].join("\n");
}

export const educationBlock = (lines) =>
  ["\\section{Education and training}", ...items(lines, "education.ts")].join("\n");

export const languagesBlock = (line) => `\\section{Languages}\n${escapeTex(line, "education.ts")}\\par`;
