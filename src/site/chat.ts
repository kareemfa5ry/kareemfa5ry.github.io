// Config for the "Ask about Kareem" chat panel. Both values are public (the Worker URL and the Turnstile
// site key; the secrets live on the Worker, see worker/README.md). Empty either one to take the chat
// section and its nav link off the home page without touching anything else.
export const CHAT = {
  workerUrl: "https://kareem-chat.eng-ramy-fakhry55.workers.dev",
  turnstileSiteKey: "0x4AAAAAAF1M1_yOKnl6g5sR",
};
export const CHAT_ENABLED = CHAT.workerUrl !== "" && CHAT.turnstileSiteKey !== "";

// Starter chips for recruiters, shown while the chat is empty: the button shows `label`, a tap sends `prompt` as
// the visitor's message. Every prompt is answerable from /llms.txt.
export const STARTER_CHIPS: readonly { label: string; prompt: string }[] = [
  {
    label: "Tech stack",
    prompt:
      "Which data, BI, SQL, Python and automation tools has Kareem used in production, and on which projects did he use them?",
  },
  {
    label: "Transferable skills",
    prompt:
      "Which of Kareem's data and analytics skills transfer outside airlines, such as retail, logistics, fintech or SaaS, and what project evidence supports that?",
  },
  {
    label: "Leadership",
    prompt:
      "How has Kareem led or built teams and processes, what were the team sizes if known, and what changed under his leadership?",
  },
  {
    label: "Results",
    prompt: "What measurable outcomes has Kareem delivered, and which numbers does his record support for each one?",
  },
  {
    label: "Career in brief",
    prompt: "Summarise Kareem's roles, employers and years of experience in three lines.",
  },
  {
    label: "Contact",
    prompt: "How can I reach Kareem, and where can I download his CV?",
  },
];

/** The one question the "Ask about this project" button sends on a project page. */
export const projectQuestion = (title: string) =>
  `Tell me about Kareem's "${title}" project: what he built, the tools he used and the results.`;

/** The chat showcase's question chips, picked from STARTER_CHIPS by label; a renamed label fails the build.
 *  "Transferable skills" is left out: the showcase's sample question already asks it. */
export const SHOWCASE_ASK_LABELS = ["Results", "Leadership"] as const;
export const SHOWCASE_ASKS = SHOWCASE_ASK_LABELS.map((label) => {
  const chip = STARTER_CHIPS.find((c) => c.label === label);
  if (!chip) throw new Error(`SHOWCASE_ASK_LABELS: no starter chip labelled "${label}"`);
  return chip;
});

/**
 * The sample exchange the chat showcase types out; owner-approved wording. No number the hero already shows.
 */
export const CHAT_SHOWCASE = {
  question: "Which of Kareem's skills transfer outside airlines?",
  answer:
    "The same work carries over to any business that sells limited stock or capacity at changing prices, such as " +
    "retail, logistics or SaaS: forecasting demand, setting prices and checking that revenue is recorded correctly. " +
    "He builds the tools himself, from SQL and Python data pipelines to Power BI dashboards and automated audit checks.",
};
