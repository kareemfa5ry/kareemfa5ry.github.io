// Floating "Ask about Kareem" widget: launcher bubble, expandable card, dock-to-side toggle. Owns only widget
// state (open, docked); the conversation is ChatPanel, rendered unchanged inside the card.
import { useEffect, useRef, useState } from "react";
import { EMAIL, MAILTO } from "../site/contact";
import ChatPanel from "./ChatPanel";
import styles from "./ChatWidget.module.css";

const DOCKED_KEY = "chat-docked";

function readDocked(): boolean {
  try {
    return localStorage.getItem(DOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDocked(docked: boolean) {
  try {
    localStorage.setItem(DOCKED_KEY, docked ? "1" : "0");
  } catch {
    // Storage blocked: the choice just lasts for this page view.
  }
}

function AgentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 7V4M9 12v1.5M15 12v1.5M2 12v3M22 12v3" />
    </svg>
  );
}

export default function ChatWidget({ workerUrl, siteKey }: { workerUrl: string; siteKey: string }) {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => setDocked(readDocked()), []);

  const opened = useRef(false);
  useEffect(() => {
    if (open) card.current?.querySelector("textarea")?.focus();
    else if (opened.current) launcher.current?.focus();
    opened.current = open;
  }, [open]);

  const minimize = () => setOpen(false);

  const toggleDock = () => {
    writeDocked(!docked);
    setDocked(!docked);
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        className={styles.launcher}
        aria-label="Ask about Kareem"
        aria-expanded={open}
        hidden={open}
        onClick={() => setOpen(true)}
      >
        <AgentIcon />
      </button>
      {open && (
        <div
          ref={card}
          role="dialog"
          aria-label="Ask about Kareem"
          className={`${styles.card} ${docked ? styles.docked : ""}`}
          onKeyDown={(e) => e.key === "Escape" && minimize()}
        >
          <header className={styles.header}>
            <h2>Ask about Kareem</h2>
            <button type="button" aria-label={docked ? "Undock" : "Dock to side"} onClick={toggleDock}>
              {docked ? "Undock" : "Dock to side"}
            </button>
            <button type="button" aria-label="Minimize" onClick={minimize}>
              Minimize
            </button>
          </header>
          <div className={styles.body}>
            <p className={styles.note}>
              Answers come from the content of this site; for anything else, email <a href={MAILTO}>{EMAIL}</a>.
            </p>
            <ChatPanel workerUrl={workerUrl} siteKey={siteKey} />
          </div>
        </div>
      )}
    </>
  );
}
