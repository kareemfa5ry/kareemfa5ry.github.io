/**
 * Owns the backdrop globe's WebGL scene: a sphere of land dots (Fibonacci spiral filtered by a land mask), an
 * occluding sphere, the route arcs, the render loop, resize and pixel budget, theme colours, pausing, and a still
 * globe under reduced motion or software (CPU) WebGL.
 * The technique of leonsoftware.com's hero globe, rebuilt on current three.js.
 */
import {
  CircleGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { createRoutes, latLonToVector } from "./globe_routes";

const RADIUS = 5;
/** How fine the globe is drawn: dots on the sphere, their radius, and the highest device-pixel ratio. */
interface Detail {
  points: number;
  dotSize: number;
  maxRatio: number;
}
const DESKTOP: Detail = { points: 65000, dotSize: 0.028, maxRatio: 2 };
/** Phones (under 48rem): under half the dots, each larger by sqrt(65000 / 30000) so the land reads the same,
 *  and a 1.5 ratio cap: less start-up work, less GPU time and battery on a box under 500 px wide. */
const PHONE: Detail = { points: 30000, dotSize: 0.041, maxRatio: 1.5 };
const TURN_MS = 75000;
/** 30 frames a second: the spin is slow, so this looks the same as 60 and costs half the GPU (or CPU) time. */
const FRAME_MS = 1000 / 30;
const START_ROTATION = -2.7;
/** Leon's camera direction, pulled back so the whole sphere (about 92% of the box) fits its square box. */
const CAMERA_DISTANCE = 25;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** The most device pixels drawn per frame, today's 720 px box at pixel ratio 2; a bigger box lowers the ratio. */
const MAX_PIXELS = 2.1e6;

/** Land dots only: sample the equirectangular mask at each Fibonacci point. */
function landDots(mask: ImageData, points: number): Vector3[] {
  const dots: Vector3[] = [];
  for (let i = 0; i < points; i++) {
    const lat = (Math.asin(1 - (2 * (i + 0.5)) / points) * 180) / Math.PI;
    const lon = (((((i * GOLDEN * 180) / Math.PI + 180) % 360) + 360) % 360) - 180;
    const x = Math.min(mask.width - 1, Math.floor(((lon + 180) / 360) * mask.width));
    const y = Math.min(mask.height - 1, Math.floor(((90 - lat) / 180) * mask.height));
    if (mask.data[(y * mask.width + x) * 4] >= 128) dots.push(latLonToVector(lat, lon, RADIUS));
  }
  return dots;
}

/** True when WebGL runs on the CPU (SwiftShader, llvmpipe): the globe then stays still, as under reduced motion. */
function isSoftwareGl(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return /swiftshader|llvmpipe|software/i.test(String(name));
}

function loadMask(): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return reject(new Error("no 2d context"));
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error("globe land mask failed to load"));
    image.src = `${import.meta.env.BASE_URL}globe/land.png`;
  });
}

function buildDots(mask: ImageData, material: MeshBasicMaterial, detail: Detail): InstancedMesh {
  const dots = landDots(mask, detail.points);
  const mesh = new InstancedMesh(new CircleGeometry(detail.dotSize, 6), material, dots.length);
  // One reused helper turns each dot to face outward (a dot at p looks at 2p), instead of ~20,000 objects.
  const helper = new Object3D();
  const outward = new Vector3();
  dots.forEach((dot, i) => {
    helper.position.copy(dot);
    helper.lookAt(outward.copy(dot).multiplyScalar(2));
    helper.updateMatrix();
    mesh.setMatrixAt(i, helper.matrix);
  });
  return mesh;
}

/** Mounts the scene in `container`; it spins while `spinWhile` (the hero) is in view and holds still below it. */
export function mountGlobe(container: HTMLElement, spinWhile: Element | null): void {
  const detail = window.matchMedia("(min-width: 48rem)").matches ? DESKTOP : PHONE;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
  container.append(renderer.domElement);

  const camera = new PerspectiveCamera(25, 1, 0.1, 100);
  camera.position.set(-14, 7.5, -11).setLength(CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);
  const scene = new Scene();
  const globe = new Group();
  globe.rotation.y = START_ROTATION;
  scene.add(globe);
  const dotMaterial = new MeshBasicMaterial();
  const occluder = new MeshBasicMaterial();
  globe.add(new Mesh(new SphereGeometry(RADIUS - 0.01, 48, 32), occluder));
  const routes = createRoutes(globe, RADIUS);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const software = isSoftwareGl(renderer);
  const still = () => software || reduced.matches;
  let visible = true;
  let spinning = true;
  let last = performance.now();
  const render = () => renderer.render(scene, camera);
  const frame = (now: number) => {
    if (now - last < FRAME_MS - 1) return;
    globe.rotation.y += ((now - last) / TURN_MS) * Math.PI * 2;
    last = now;
    routes.update(now);
    render();
  };
  const sync = () => {
    const animate = visible && spinning && !document.hidden && !still();
    last = performance.now();
    renderer.setAnimationLoop(animate ? frame : null);
    if (!animate) routes.showAll();
    render();
  };
  const colours = () => {
    const style = getComputedStyle(container);
    routes.setColor(new Color(style.color));
    dotMaterial.color.set(style.borderTopColor);
    occluder.color.set(style.outlineColor);
    sync();
  };
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, detail.maxRatio, Math.sqrt(MAX_PIXELS / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
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

  loadMask()
    .then((mask) => {
      globe.add(buildDots(mask, dotMaterial, detail));
      colours();
      resize();
    })
    .catch(() => undefined); // ponytail: the globe is decorative; without its mask the page just has no globe
}
