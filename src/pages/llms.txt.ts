// /llms.txt (https://llmstxt.org): the CV in plain Markdown for AI assistants, generated from the content. Every
// project and job carries its bullets, headline numbers and before -> after results, so the chat Worker (which reads
// this file as its only knowledge) can quote them.
import type { APIContext } from "astro";
import { type CollectionEntry, getCollection } from "astro:content";
import { changeText, type Result } from "../components/charts/scale";
import { type BulletItem, bulletsFor } from "../site/bullets";
import { EMAIL, FULL_NAME, LINKEDIN_URL } from "../site/contact";
import { CV_FILES } from "../site/cv_files";
import { EDUCATION, LANGUAGES } from "../site/education";
import { DOMAIN } from "../site/knowledge/domain";
import { GLOSSARY } from "../site/knowledge/glossary";
import { PROFILE_SUMMARY, TAGLINE } from "../site/profile";

const byOrder = <T extends { data: { order: number } }>(entries: T[]) =>
  [...entries].sort((a, b) => a.data.order - b.data.order);

const bulletLines = (bullets: BulletItem[]) => bulletsFor(bullets).map((bullet) => `- ${bullet}`);
const resultLines = (results: Result[]) => results.map((r) => `- Result: ${r.label}: ${changeText(r)}`);

function projectLines({ data }: CollectionEntry<"projects">, href: string): string[] {
  const where = data.period ? `${data.org}, ${data.period}` : data.org;
  return [
    `### [${data.title}](${href})`,
    `${where}. ${data.summary}`,
    ...bulletLines(data.bullets),
    ...data.metrics.map((m) => `- ${m.value} ${m.label}`),
    ...resultLines(data.results),
    "",
  ];
}

function jobLines({ data }: CollectionEntry<"experience">): string[] {
  const period = `${data.start}–${data.end ?? "present"}`;
  return [
    `### ${data.title ?? data.org} · ${data.org}, ${data.location}, ${period}`,
    ...(data.note ? [data.note] : []),
    ...bulletLines(data.bullets),
    ...resultLines(data.results),
    "",
  ];
}

export async function GET({ site }: APIContext) {
  const url = (path: string) => new URL(path, site).href;
  const projects = byOrder(await getCollection("projects"));
  const experience = byOrder(await getCollection("experience"));
  const skills = byOrder(await getCollection("skills"));

  const lines = [
    `# ${FULL_NAME}`,
    "",
    `> ${TAGLINE}`,
    "",
    PROFILE_SUMMARY,
    "",
    "## Projects",
    "",
    ...projects.flatMap((project) => projectLines(project, url(`/projects/${project.id}/`))),
    "## Experience",
    "",
    ...experience.flatMap(jobLines),
    "## Skills",
    ...skills.map(({ data }) => `- ${data.label}: ${data.items.join(", ")}`),
    "",
    "## Education, training and languages",
    ...[...EDUCATION, LANGUAGES].map((line) => `- ${line}`),
    "",
    "## Industry and domain knowledge",
    ...DOMAIN.map((line) => `- ${line}`),
    "",
    "## Glossary",
    ...GLOSSARY.map(({ term, meaning }) => `- ${term}: ${meaning}`),
    "",
    "## CV",
    ...CV_FILES.map((cv) => `- [${cv.title}](${url(cv.href)}): ${cv.blurb}`),
    "",
    "## Contact",
    `- Email: ${EMAIL}`,
    `- [LinkedIn](${LINKEDIN_URL})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
