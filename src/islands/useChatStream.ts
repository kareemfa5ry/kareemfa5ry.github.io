// Conversation state for ChatPanel: the transcript, the history sent to the Worker, Turnstile and the SSE read.
import { useRef, useState } from "react";
import { trimHistory, type Turn } from "./chat_history";

export interface Line {
  id: number;
  role: "user" | "assistant" | "system";
  text: string;
}
interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | undefined;
function loadTurnstile() {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.turnstile as TurnstileApi);
    script.onerror = () => {
      scriptPromise = undefined;
      console.error("Turnstile", "script");
      reject(new Error("turnstile:script"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

const isTurnstileError = (error: unknown) => error instanceof Error && error.message.startsWith("turnstile:");

const postChat = (workerUrl: string, messages: Turn[], turnstileToken: string) =>
  fetch(`${workerUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, turnstileToken }),
  });

/** Reads the SSE body, passing each text chunk on; returns the error message ("" when the stream was fine). */
async function readChat(response: Response, onText: (chunk: string) => void): Promise<string> {
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return body.error ?? "Something went wrong. Try again.";
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return "";
    buffer += value;
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames.filter((f) => f.startsWith("data: "))) {
      const event = JSON.parse(frame.slice(6)) as { text?: string; error?: string };
      if (event.error) return event.error;
      if (event.text) onText(event.text);
    }
  }
}

export function useChatStream(workerUrl: string, siteKey: string, box: React.RefObject<HTMLDivElement | null>) {
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const past = useRef<Turn[]>([]);
  const nextId = useRef(0);
  const widget = useRef<Promise<string>>(undefined);
  const waiting = useRef<{ ok: (token: string) => void; fail: (error: Error) => void }>(undefined);

  /** Loads Turnstile and renders the hidden widget once; safe to call on every focus. */
  const prepare = () => {
    widget.current ??= loadTurnstile().then((api) =>
      api.render(box.current as HTMLElement, {
        sitekey: siteKey,
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => waiting.current?.ok(token),
        "error-callback": (code: string) => {
          console.error("Turnstile", code);
          waiting.current?.fail(new Error(`turnstile:${code}`));
        },
      }),
    );
    widget.current.catch(() => (widget.current = undefined));
  };

  const attempt = async () => {
    prepare();
    const id = await (widget.current as Promise<string>);
    const api = window.turnstile as TurnstileApi;
    return new Promise<string>((ok, fail) => {
      waiting.current = { ok, fail };
      api.execute(id);
    });
  };

  /** One token; a failed widget is removed and rendered afresh, then the token is asked for once more. */
  const token = async () => {
    try {
      return await attempt();
    } catch (error) {
      if (!isTurnstileError(error)) throw error;
      const stale = widget.current;
      widget.current = undefined;
      await stale?.then((id) => window.turnstile?.remove(id)).catch(() => {});
      return attempt();
    }
  };

  const add = (role: Line["role"], text: string) => {
    const line = { id: nextId.current++, role, text };
    setLines((all) => [...all, line]);
    return line.id;
  };
  const patch = (id: number, fn: (text: string) => string | null) =>
    setLines((all) =>
      all.flatMap((l) => {
        if (l.id !== id) return [l];
        const text = fn(l.text);
        return text === null ? [] : [{ ...l, text }];
      }),
    );

  const send = async (question: string) => {
    const messages = trimHistory([...past.current, { role: "user", content: question }]);
    setBusy(true);
    add("user", question);
    const answer = add("assistant", "");
    let text = "";
    let failure = "";
    try {
      const response = await postChat(workerUrl, messages, await token());
      failure = await readChat(response, (chunk) => {
        text += chunk;
        patch(answer, (t) => t + chunk);
      });
    } catch (error) {
      failure = isTurnstileError(error)
        ? "The human check did not complete. Reload the page and try again."
        : "Could not reach the server. Check your connection and try again.";
    } finally {
      widget.current?.then((id) => window.turnstile?.reset(id)).catch(() => {});
    }
    if (failure || !text) {
      patch(answer, () => null);
      add("system", failure || "No answer came back. Try again.");
    } else {
      past.current = [...messages, { role: "assistant", content: text }];
    }
    setBusy(false);
  };

  return { lines, busy, send, prepare };
}
