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
