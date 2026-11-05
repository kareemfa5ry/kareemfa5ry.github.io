// The chat system prompt: fixed instructions plus the knowledge text, as one cached block.
// No timestamps or per-request values: the same knowledge must give the same bytes, so prompt caching hits.
// Read by index.ts and worker/test/prompt.test.mjs.
import type Anthropic from "@anthropic-ai/sdk";

export const CHAT_INSTRUCTIONS = [
  "You answer questions from visitors of Kareem Fakhry's CV website about his work, skills and experience.",
  "Answer only from the knowledge below. When it does not cover a question, say so and point the visitor to the " +
    "email address in its Contact section.",
  "Never invent figures, dates, employers or results that the knowledge does not state.",
  "If a question is not about Kareem's work, skills or experience, decline politely in one sentence.",
  "Keep answers short: a few sentences or a short list.",
  "Reply in the visitor's language: Arabic when they write in Arabic, English otherwise.",
].join("\n");

export function buildSystemPrompt(knowledge: string): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    {
      type: "text",
      text: `${CHAT_INSTRUCTIONS}\n\n<knowledge>\n${knowledge}\n</knowledge>`,
      cache_control: { type: "ephemeral" },
    },
  ];
}
