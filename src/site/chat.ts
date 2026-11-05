// Config for the "Ask about Kareem" chat panel. Both values are public: set them after the Worker is deployed
// (see worker/README.md). While either is empty the home page renders no chat section and no nav link.
export const CHAT = { workerUrl: "", turnstileSiteKey: "" };
export const CHAT_ENABLED = CHAT.workerUrl !== "" && CHAT.turnstileSiteKey !== "";
