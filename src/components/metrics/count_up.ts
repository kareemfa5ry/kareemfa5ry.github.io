// Count-up for headline numbers: `splitNumber` parses a display value, `initCountUp` animates `[data-count-up]`.
export interface NumberParts {
  prefix: string;
  number: number;
  decimals: number;
  separators: boolean;
  suffix: string;
}

/** "~660×" -> prefix "~", number 660, suffix "×". Null when the value holds no digit (it stays static). */
export function splitNumber(value: string): NumberParts | null {
  const m = /^(\D*?)(\d[\d,]*(?:\.(\d+))?)(.*)$/s.exec(value);
  if (!m) return null;
  return {
    prefix: m[1],
    number: Number(m[2].replaceAll(",", "")),
    decimals: m[3]?.length ?? 0,
    separators: m[2].includes(","),
    suffix: m[4],
  };
}

const DURATION_MS = 800;

function format(p: NumberParts, n: number): string {
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
    useGrouping: p.separators,
  });
  return `${p.prefix}${body}${p.suffix}`;
}

function animate(el: HTMLElement, p: NumberParts, final: string): void {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / DURATION_MS, 1);
    el.textContent = t === 1 ? final : format(p, p.number * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function start(el: HTMLElement): void {
  const final = el.textContent ?? "";
  const parts = splitNumber(final);
  if (!parts) return;
  el.style.display = "inline-block";
  el.style.fontVariantNumeric = "tabular-nums";
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  animate(el, parts, final);
}

/** Observe every `[data-count-up]` once; the HTML already holds the final value, so nothing runs without JS. */
export function initCountUp(): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      start(entry.target as HTMLElement);
    }
  });
  document.querySelectorAll("[data-count-up]").forEach((el) => observer.observe(el));
}
