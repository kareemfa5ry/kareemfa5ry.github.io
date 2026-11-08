// Kareem's headline text: tagline, profile paragraph and the stats, availability. The one home for the page header
// and profile section; collection entries (src/content/) hold the rest of the CV.
export interface Stat {
  /** The number as displayed, e.g. "68M". */
  value: string;
  /** What the number counts. */
  label: string;
}

export const TAGLINE = "Senior Data Analyst and Revenue Manager · 15 years in airline revenue, pricing and operations";

export const PROFILE_SUMMARY =
  "Data analyst with 15 years in airline revenue, pricing and operations. I build the full path from raw system " +
  "files to a business decision: SQL and Python data pipelines, Power BI dashboards, forecasts, customer " +
  "segmentation and statistical tests. I find money that is being lost, such as uncollected penalties, unbilled " +
  "extra baggage and partners breaking contract rules, and I train commercial teams to use AI in their daily work.";

export const STATS: readonly Stat[] = [
  { value: "3×", label: "revenue growth in one year, USD 1.6M → 5.0M" },
  { value: "USD 1.5M", label: "refund backlog cleared, ~60% without cash" },
  { value: "95%", label: "of audit breach cases accepted by Finance" },
  { value: "68M", label: "operational log records parsed and linked" },
];

/** The first three STATS, the outcome numbers the hero shows. */
export const HERO_STATS = STATS.slice(0, 3);

export const AVAILABILITY: readonly string[] = [
  "Open to full-time, part-time, contract and consulting roles.",
  "Roles: revenue or analytics management, senior analyst, AI enablement, consultant.",
  "Onsite, hybrid or remote. Based in Cairo, Egypt and open to relocation.",
];
