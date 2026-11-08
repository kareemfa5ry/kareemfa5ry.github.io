// The published CV PDFs (public/assets/cv/) and how each is generated (cv/*.tex): the one home for their titles,
// descriptions, paths, headlines and the ordered project and skill ids each CV shows.
import type { CvId } from "./bullets";

export interface CvFile {
  id: CvId;
  title: string;
  blurb: string;
  href: string;
  /** Second line of the CV header. */
  headline: string;
  /** Replaces PROFILE_SUMMARY in this CV when set. */
  summary?: string;
  /** Project ids (file names in src/content/projects/), in the order shown. */
  projects: readonly string[];
  /** Skill group ids (file names in src/content/skills/), in the order shown. */
  skills: readonly string[];
}

export const CV_FILES: readonly CvFile[] = [
  {
    id: "sda",
    title: "Senior Data Analyst",
    blurb: "Data pipelines, BI, forecasting and statistical analysis.",
    href: "/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf",
    headline: "Senior Data Analyst | Revenue, Pricing and Operations Analytics | SQL · Python · Power BI",
    projects: [
      "daily-revenue-pipeline",
      "operational-log-parser",
      "customer-route-analytics-power-bi",
      "revenue-audit-engine",
      "competitor-price-tracker",
    ],
    skills: ["sql-and-databases", "bi-and-reporting", "statistics-and-analysis", "programming", "ai", "source-systems"],
  },
  {
    id: "rpm",
    title: "Revenue and Pricing Manager",
    blurb: "Pricing, capacity, distribution and revenue assurance.",
    href: "/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf",
    headline: "Revenue and Pricing Manager | Pricing · Capacity · Demand Forecasting · Revenue Assurance",
    projects: [
      "competitor-price-tracker",
      "daily-revenue-pipeline",
      "customer-route-analytics-power-bi",
      "revenue-audit-engine",
      "operational-log-parser",
    ],
    skills: [
      "revenue-management",
      "revenue-assurance",
      "commercial",
      "sql-and-databases",
      "bi-and-reporting",
      "statistics-and-analysis",
      "source-systems",
      "leadership",
    ],
  },
];
