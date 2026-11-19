/**
 * The page side of the backdrop globe: hands a canvas to the globe worker (globe_worker, where three.js runs) and
 * tells it the box size, the theme colours (read from the box's CSS probes) and when to spin: while `spinWhile`
 * (the hero) and the layer are in view, the tab is shown and reduced motion is off. Draws nothing itself.
 */
import type { GlobeMessage } from "./globe_worker";

export function mountGlobe(container: HTMLElement, spinWhile: Element | null): void {
  const canvas = document.createElement("canvas");
  // ponytail: decorative; a browser without OffscreenCanvas WebGL (Safari before 17) just has no globe.
  if (!("transferControlToOffscreen" in canvas)) return;
  canvas.style.cssText = "width:100%;height:100%;display:block";
  container.append(canvas);
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker(new URL("./globe_worker.ts", import.meta.url), { type: "module" });
  const post = (message: GlobeMessage, transfer: Transferable[] = []) => worker.postMessage(message, transfer);
  const phone = !window.matchMedia("(min-width: 48rem)").matches;
  const maskUrl = new URL(`${import.meta.env.BASE_URL}globe/land.png`, location.href).href;
  post({ type: "start", canvas: offscreen, phone, maskUrl }, [offscreen]);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let spinning = true;
  const sync = () => post({ type: "animate", on: visible && spinning && !document.hidden && !reduced.matches });
  const colours = () => {
    const style = getComputedStyle(container);
    post({ type: "colours", route: style.color, dot: style.borderTopColor, bg: style.outlineColor });
  };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (width && height) post({ type: "size", width, height, ratio: window.devicePixelRatio });
  };

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(container);
  if (spinWhile)
    new IntersectionObserver(([entry]) => {
      spinning = entry.isIntersecting;
      sync();
    }).observe(spinWhile);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", colours);
  new MutationObserver(colours).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  colours();
  sync();
}
