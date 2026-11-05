// /resume.json (JSON Resume v1, https://jsonresume.org/schema): the CV for recruiter tooling, from the content.
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { EMAIL, FULL_NAME, LINKEDIN_URL } from "../site/contact";
import { plainBullets } from "../site/plain_bullets";
import { PROFILE_SUMMARY, TAGLINE } from "../site/profile";

export async function GET({ site }: APIContext) {
  const byOrder = <T extends { data: { order: number } }>(entries: T[]) =>
    [...entries].sort((a, b) => a.data.order - b.data.order);
  const projects = byOrder(await getCollection("projects"));
  const experience = byOrder(await getCollection("experience"));
  const skills = byOrder(await getCollection("skills"));

  const resume = {
    basics: {
      name: FULL_NAME,
      label: TAGLINE,
      email: EMAIL,
      url: site?.href,
      summary: PROFILE_SUMMARY,
      location: { city: "Cairo", countryCode: "EG" },
      profiles: [{ network: "LinkedIn", url: LINKEDIN_URL }],
    },
    work: experience.map(({ data, body }) => ({
      name: data.org,
      position: data.title ?? data.org,
      startDate: data.start,
      ...(data.end && { endDate: data.end }),
      summary: data.note,
      highlights: plainBullets(body),
    })),
    projects: projects.map(({ id, data, body }) => ({
      name: data.title,
      description: data.summary,
      highlights: plainBullets(body),
      keywords: data.stack,
      url: new URL(`/projects/${id}/`, site).href,
    })),
    skills: skills.map(({ data }) => ({ name: data.label, keywords: data.items })),
  };
  return new Response(JSON.stringify(resume, null, 2), { headers: { "Content-Type": "application/json" } });
}
