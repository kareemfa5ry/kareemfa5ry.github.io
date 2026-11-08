// "Ask about Kareem" chat. The section copy is server-rendered in index.astro; this island owns only the
// conversation: transcript, input and the stream from the Worker (see useChatStream.ts).
import { useRef, useState } from "react";
import { STARTER_CHIPS } from "../site/chat";
import { useChatStream } from "./useChatStream";
import styles from "./ChatPanel.module.css";

const MAX = 1000;

export default function ChatPanel({ workerUrl, siteKey }: { workerUrl: string; siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const { lines, busy, send, prepare } = useChatStream(workerUrl, siteKey, box);
  const [draft, setDraft] = useState("");
  const question = draft.trim();

  const submit = () => {
    if (busy || question === "") return;
    setDraft("");
    void send(question);
  };

  return (
    <div className={styles.panel}>
      <ol className={styles.log} role="log" aria-live="polite" aria-label="Conversation">
        {lines.map((line) => (
          <li key={line.id} className={styles[line.role]}>
            {line.text || "…"}
          </li>
        ))}
      </ol>
      {lines.length === 0 && (
        <div className={styles.chips} role="group" aria-label="Suggested questions">
          {STARTER_CHIPS.map(({ label, prompt }) => (
            <button key={label} type="button" className={styles.chip} disabled={busy} onClick={() => void send(prompt)}>
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
          rows={3}
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
