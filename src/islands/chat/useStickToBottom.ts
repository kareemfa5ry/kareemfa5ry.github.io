// Keeps a scrolling transcript showing its newest text while it grows, unless the visitor scrolled up.
import { useEffect, type RefObject } from "react";

const NEAR = 48; // px from the bottom that still counts as "at the bottom"

export function useStickToBottom(log: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = log.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pinned = true;
    let top = 0;
    // Scrolling up leaves the bottom; our own smooth scroll only moves down, so it never unpins mid-animation.
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR;
      pinned = near || (pinned && el.scrollTop >= top);
      top = el.scrollTop;
    };
    // Fires on each new line and each streamed token. scrollIntoView also moves an outer scroller (the panel body).
    const watch = new MutationObserver(() => {
      if (!pinned) return;
      const behavior = reduce.matches ? "instant" : "smooth";
      el.scrollTo({ top: el.scrollHeight, behavior });
      el.scrollIntoView({ block: "end", behavior });
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    watch.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      watch.disconnect();
    };
  }, [log]);
}
