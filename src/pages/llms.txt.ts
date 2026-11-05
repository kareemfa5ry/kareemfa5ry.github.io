// /llms.txt (https://llmstxt.org): the CV in plain Markdown for AI assistants, generated from the content.
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { EMAIL, FULL_NAME, LINKEDIN_URL } from "../site/contact";
import { plainBullets } from "../site/plain_bullets";
import { PROFILE_SUMMARY, TAGLINE } from "../site/profile";

const CVS = [
  ["Senior Data Analyst", "/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf"],
  ["Revenue and Pricing Manager", "/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf"],
] as const;

export async function GET({ site }: APIContext) {
  const url = (path: string) => new URL(path, site).href;
  const byOrder = <T extends { data: { order: number } }>(entries: T[]) =>
    [...entries].sort((a, b) => a.data.order - b.data.order);
  const projects = byOrder(await getCollection("projects"));
  const experience = byOrder(await getCollection("experience"));
  const skills = byOrder(await getCollection("skills"));

  const jobs = experience.map(({ data, body }) => {
    const period = `${data.start}–${data.end ?? "present"}`;
    return `- ${data.title ?? data.org} · ${data.org}, ${period}: ${data.note ?? plainBullets(body)[0]}`;
  });
  const lines = [
    `# ${FULL_NAME}`,
    "",
    `> ${TAGLINE}`,
    "",
    PROFILE_SUMMARY,
    "",
    "## Projects",
    ...projects.map(({ id, data }) => `- [${data.title}](${url(`/projects/${id}/`)}): ${data.summary}`),
    "",
    "## Experience",
    ...jobs,
    "",
    "## Skills",
    ...skills.map(({ data }) => `- ${data.label}: ${data.items.join(", ")}`),
    "",
    "## CV",
    ...CVS.map(([title, path]) => `- [${title}](${url(path)}): PDF`),
    "",
    "## Contact",
    `- Email: ${EMAIL}`,
    `- [LinkedIn](${LINKEDIN_URL})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
