// "Ask about Kareem" chat. The section copy is server-rendered in index.astro; this island owns only the
// conversation: transcript, input and the stream from the Worker (see useChatStream.ts).
import { useRef, useState } from "react";
import { STARTER_CHIPS } from "../site/chat";
import { linkify } from "./chat/linkify";
import { useStickToBottom } from "./chat/useStickToBottom";
import { useChatStream } from "./chat/useChatStream";
import styles from "./ChatPanel.module.css";

const MAX = 1000;

/** Text nodes plus anchors; nothing the model writes is ever parsed as HTML. */
function Linked({ text }: { text: string }) {
  return linkify(text).map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <a
        key={i}
        href={part.href}
        {...(part.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {part.text}
      </a>
    ),
  );
}

export default function ChatPanel({ workerUrl, siteKey }: { workerUrl: string; siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const { lines, busy, send, prepare } = useChatStream(workerUrl, siteKey, box);
  const [draft, setDraft] = useState("");
  const [used, setUsed] = useState<string[]>([]);
  const [typedFirst, setTypedFirst] = useState(false);
  const log = useRef<HTMLOListElement>(null);
  useStickToBottom(log);
  // Chips show until each is used, or until the visitor's own first question was free text.
  const chips = typedFirst ? [] : STARTER_CHIPS.filter((c) => !used.includes(c.label));
  const question = draft.trim();

  const submit = () => {
    if (busy || question === "") return;
    if (lines.length === 0) setTypedFirst(true);
    setDraft("");
    void send(question);
  };

  return (
    <div className={styles.panel}>
      <ol ref={log} className={styles.log} role="log" aria-live="polite" aria-label="Conversation">
        {lines.map((line) => (
          <li key={line.id} className={styles[line.role]}>
            {line.role === "assistant" && line.text ? <Linked text={line.text} /> : line.text || "…"}
          </li>
        ))}
      </ol>
      {chips.length > 0 && (
        <div
          className={lines.length === 0 ? styles.chips : `${styles.chips} ${styles.compact}`}
          role="group"
          aria-label="Suggested questions"
        >
          {chips.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              className={styles.chip}
              disabled={busy}
              onClick={async () => {
                setUsed((u) => [...u, label]);
                if (!(await send(prompt))) setUsed((u) => u.filter((l) => l !== label));
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-input">Your question</label>
        <textarea
          id="chat-input"
          className={styles.input}
          rows={2}
          maxLength={MAX}
          value={draft}
          onFocus={prepare}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className={styles.row}>
          <span className={styles.count}>
            {draft.length} / {MAX}
          </span>
          <button type="submit" className={styles.send} disabled={busy || question === ""}>
            {busy ? "Answering…" : "Send"}
          </button>
        </div>
      </form>
      <div ref={box} className={styles.challenge} />
    </div>
  );
}
