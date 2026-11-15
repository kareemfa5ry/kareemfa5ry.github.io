// /resume.json (JSON Resume v1, https://jsonresume.org/schema): the CV for recruiter tooling, from the content.
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { bulletsFor } from "../site/bullets";
import { byOrder } from "../site/collections/by_order";
import { EMAIL, FULL_NAME, LINKEDIN_URL, WHATSAPP_URL, WHATSAPP_USERNAME } from "../site/contact";
import { PROFILE_SUMMARY, TAGLINE } from "../site/profile";

export async function GET({ site }: APIContext) {
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
      profiles: [
        { network: "LinkedIn", url: LINKEDIN_URL },
        { network: "WhatsApp", username: WHATSAPP_USERNAME, url: WHATSAPP_URL },
      ],
    },
    work: experience.map(({ data }) => ({
      name: data.org,
      position: data.title ?? data.org,
      startDate: data.start,
      ...(data.end && { endDate: data.end }),
      summary: data.note,
      highlights: bulletsFor(data.bullets),
    })),
    projects: projects.map(({ id, data }) => ({
      name: data.title,
      description: data.summary,
      highlights: bulletsFor(data.bullets),
      keywords: data.stack,
      url: new URL(`/projects/${id}/`, site).href,
    })),
    skills: skills.map(({ data }) => ({ name: data.label, keywords: data.items })),
  };
  return new Response(JSON.stringify(resume, null, 2), { headers: { "Content-Type": "application/json" } });
}
