/**
 * The globe worker: runs the WebGL scene (globe_scene) off the main thread, so three.js start-up, the dot build and
 * every frame never block the page. Owns the messages the page side (globe_host) sends it.
 */
import { startGlobe, type GlobeColours, type GlobeScene } from "./globe_scene";

export type GlobeMessage =
  | { type: "start"; canvas: OffscreenCanvas; phone: boolean; maskUrl: string }
  | { type: "size"; width: number; height: number; ratio: number }
  | ({ type: "colours" } & GlobeColours)
  | { type: "animate"; on: boolean };

let scene: GlobeScene | undefined;

self.addEventListener("message", ({ data }: MessageEvent<GlobeMessage>) => {
  if (data.type === "start") scene = startGlobe(data.canvas, data.phone, data.maskUrl);
  else if (data.type === "size") scene?.resize(data.width, data.height, data.ratio);
  else if (data.type === "colours") scene?.setColours(data);
  else scene?.setAnimate(data.on);
});
