// The published CV PDFs (public/assets/cv/): the one home for their titles, descriptions and paths.
export interface CvFile {
  title: string;
  blurb: string;
  href: string;
}

export const CV_FILES: readonly CvFile[] = [
  {
    title: "Senior Data Analyst",
    blurb: "Data pipelines, BI, forecasting and statistical analysis.",
    href: "/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf",
  },
  {
    title: "Revenue and Pricing Manager",
    blurb: "Pricing, capacity, distribution and revenue assurance.",
    href: "/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf",
  },
];
