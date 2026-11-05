// Content collections for the CV site: projects, experience and skill groups, one Markdown file per entry in
// src/content/<collection>/. Every field carries a .describe(); src/content/README.md tables them for editors.
// Objects are strict: a misspelt or unknown front matter key fails the build.
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function markdownIn(collection: string) {
  return glob({ base: `./src/content/${collection}`, pattern: "**/*.md" });
}

const displayOrder = z
  .number()
  .int()
  .positive()
  .describe("Position on the page within its section: 1 shows first, then 2, and so on.");

const yearMonth = z.string().regex(YEAR_MONTH, "use YYYY-MM, e.g. 2026-02");

const metric = z.strictObject({
  value: z.string().min(1).describe("The number as displayed, e.g. '68M' or 'USD 1.5M'."),
  label: z.string().min(1).describe("What the number counts, e.g. 'operational log records parsed'."),
});

const result = z.strictObject({
  label: z.string().min(1).describe("What changed, e.g. 'Unmatched baggage records'."),
  before: z.number().describe("The value before the work, as a number."),
  after: z.number().describe("The value after the work, as a number."),
  unit: z.string().min(1).optional().describe("Unit shown after the numbers, e.g. '%' or 'USD M'."),
  note: z.string().min(1).optional().describe("Source wording when a number is rounded, e.g. 'under 1%'."),
});

const results = z
  .array(result)
  .default([])
  .describe("Before -> after numbers drawn as a chart under the bullets; only values the bullets state.");

const projects = defineCollection({
  loader: markdownIn("projects"),
  schema: ({ image }) =>
    z.strictObject({
      title: z.string().min(1).describe("Project name, shown as the heading."),
      org: z.string().min(1).describe("Organisation the work was done for, e.g. 'Nesma Airlines'."),
      period: z
        .string()
        .min(1)
        .optional()
        .describe(
          "When, shown as typed: '2026' or '2023–2024'. Quote it in front matter. Omit when the page shows no year.",
        ),
      order: displayOrder,
      summary: z.string().min(1).describe("One sentence on what it does and why it mattered; used on cards and chat."),
      stack: z.array(z.string().min(1)).describe("Technology tag labels, shown as chips in this order."),
      skills: z
        .array(reference("skills"))
        .describe("Skill group ids this project proves: file names in src/content/skills/ without .md."),
      metrics: z.array(metric).describe("Headline numbers for this project; [] when there are none."),
      screenshots: z
        .array(
          z.strictObject({
            src: image().describe("Path from this file to the image: ../../assets/projects/<slug>/<nn>-<what>.png"),
            alt: z.string().min(1).describe("What the image shows, for screen readers. Mandatory."),
            caption: z.string().min(1).optional().describe("Optional line shown under the image."),
          }),
        )
        .describe("Images in display order; [] when there are none."),
      results,
    }),
});

const experience = defineCollection({
  loader: markdownIn("experience"),
  schema: z.strictObject({
    title: z
      .string()
      .min(1)
      .optional()
      .describe("Job title, e.g. 'Revenue Manager'. Omit when the roles are listed in the note, as for Air Arabia."),
    org: z.string().min(1).describe("Employer or client, e.g. 'Nesma Airlines'."),
    location: z.string().min(1).describe("City or region, e.g. 'Cairo' or 'Egypt and UAE'."),
    start: yearMonth.describe("First month in the role, YYYY-MM, quoted."),
    end: yearMonth.nullable().describe("Last month in the role, YYYY-MM quoted, or null while it is current."),
    note: z.string().min(1).optional().describe("Optional context line shown above the bullets."),
    order: displayOrder,
    projects: z
      .array(reference("projects"))
      .optional()
      .describe("Project ids done in this role: file names in src/content/projects/ without .md."),
    results,
  }),
});

const skills = defineCollection({
  loader: markdownIn("skills"),
  schema: z.strictObject({
    label: z.string().min(1).describe("Skill group name, e.g. 'SQL and databases'."),
    order: displayOrder,
    items: z.array(z.string().min(1)).min(1).describe("Skills in this group, shown in this order."),
  }),
});

export const collections = { projects, experience, skills };
