/**
 * Owns the backdrop globe's WebGL scene: a sphere of land dots (Fibonacci spiral filtered by a land mask), an
 * occluding sphere, the route arcs, the render loop, the pixel budget, and a still globe on software (CPU) WebGL.
 * Runs inside the globe worker on an OffscreenCanvas, so it touches no DOM: the page side (globe_host) sends the
 * box size, the theme colours and whether to spin.
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

/** The colours the page reads from its CSS probes, as CSS colour strings. */
export interface GlobeColours {
  route: string;
  dot: string;
  bg: string;
}

export interface GlobeScene {
  resize(width: number, height: number, devicePixelRatio: number): void;
  setColours(colours: GlobeColours): void;
  /** Spin (and animate the routes) or hold still; software WebGL always holds still. */
  setAnimate(on: boolean): void;
}

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

/** The land mask's pixels, decoded off the main thread (no Image or document in a worker). */
async function loadMask(url: string): Promise<ImageData> {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("no 2d context");
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
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

/** Starts the scene on `canvas`; `phone` picks the lighter detail. The dots appear once the mask has loaded. */
export function startGlobe(canvas: OffscreenCanvas, phone: boolean, maskUrl: string): GlobeScene {
  const detail = phone ? PHONE : DESKTOP;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
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

  const software = isSoftwareGl(renderer);
  let last = performance.now();
  const render = () => renderer.render(scene, camera);
  const frame = (now: number) => {
    if (now - last < FRAME_MS - 1) return;
    globe.rotation.y += ((now - last) / TURN_MS) * Math.PI * 2;
    last = now;
    routes.update(now);
    render();
  };

  loadMask(maskUrl)
    .then((mask) => {
      globe.add(buildDots(mask, dotMaterial, detail));
      render();
    })
    .catch(() => undefined); // ponytail: the globe is decorative; without its mask the page just has no globe

  return {
    resize(width, height, devicePixelRatio) {
      renderer.setPixelRatio(Math.min(devicePixelRatio, detail.maxRatio, Math.sqrt(MAX_PIXELS / (width * height))));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    },
    setColours({ route, dot, bg }) {
      routes.setColor(new Color(route));
      dotMaterial.color.set(dot);
      occluder.color.set(bg);
      render();
    },
    setAnimate(on) {
      const animate = on && !software;
      last = performance.now();
      renderer.setAnimationLoop(animate ? frame : null);
      if (!animate) routes.showAll();
      render();
    },
  };
}
