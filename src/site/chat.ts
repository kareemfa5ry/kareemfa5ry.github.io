// Config for the "Ask about Kareem" chat panel. Both values are public (the Worker URL and the Turnstile
// site key; the secrets live on the Worker, see worker/README.md). Empty either one to take the chat
// section and its nav link off the home page without touching anything else.
export const CHAT = {
  workerUrl: "https://kareem-chat.eng-ramy-fakhry55.workers.dev",
  turnstileSiteKey: "0x4AAAAAAF1M1_yOKnl6g5sR",
};
export const CHAT_ENABLED = CHAT.workerUrl !== "" && CHAT.turnstileSiteKey !== "";
