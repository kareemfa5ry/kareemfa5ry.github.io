// "2026-02" -> "Feb 2026": the month label shown on the page and in the CV PDFs.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}
