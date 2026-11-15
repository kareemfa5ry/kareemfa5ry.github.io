/**
 * Owns the globe's route arcs: the city list, the lat/lon to sphere mapping shared with the land dots, and the
 * animated great-circle arcs (draw in, ripple at the destination, fade out, idle).
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
  type Object3D,
} from "three";

export const CYCLE_MS = 8000;
/** Each route rests this many cycles after it fades, so about 3 of the 8 are on screen at once. */
const REST_CYCLES = 1;
/** Launch-order step: 3 shares no factor with 8, so neighbours (London, Paris) never launch back to back. */
const LAUNCH_STEP = 3;
const ARC_POINTS = 100;
const LIFT = 0.18;
const RIPPLE_SIZE = 0.5;

export interface City {
  name: string;
  lat: number;
  lon: number;
}

export const ORIGIN: City = { name: "Cairo", lat: 30.04, lon: 31.24 };
export const DESTINATIONS: City[] = [
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Frankfurt", lat: 50.11, lon: 8.68 },
  { name: "Dubai", lat: 25.2, lon: 55.27 },
  { name: "New York", lat: 40.71, lon: -74.0 },
  { name: "Beijing", lat: 39.9, lon: 116.4 },
  { name: "Johannesburg", lat: -26.2, lon: 28.05 },
  { name: "Jeddah", lat: 21.54, lon: 39.17 },
];

/** Vector for a latitude/longitude in degrees; the land dots and the cities both use it. */
export function latLonToVector(lat: number, lon: number, radius = 1): Vector3 {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  const unit = new Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
  return unit.multiplyScalar(radius);
}

/**
 * Where route `index` (of `count`) is in its cycle at `timeMs`: 0 to 1.
 * update() maps this to draw, ripple, fade, idle.
 */
export function routePhase(index: number, count: number, timeMs: number): number {
  const period = 1 + REST_CYCLES;
  const slot = ((index * LAUNCH_STEP) % count) / count;
  const local = ((timeMs / CYCLE_MS / period + slot) % 1) * period;
  return local < 1 ? local : 0.9; // 0.9 sits in the hidden part of the cycle while the route rests
}

/** Points along the great circle from a to b, lifted off the sphere in proportion to the arc's length. */
function arcPoints(a: Vector3, b: Vector3, radius: number): Vector3[] {
  const angle = a.angleTo(b);
  const sinAngle = Math.sin(angle);
  const points: Vector3[] = [];
  for (let i = 0; i < ARC_POINTS; i++) {
    const t = i / (ARC_POINTS - 1);
    const point = a
      .clone()
      .multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
      .add(b.clone().multiplyScalar(Math.sin(t * angle) / sinAngle));
    points.push(point.multiplyScalar(radius * (1 + Math.sin(Math.PI * t) * LIFT * (angle / Math.PI))));
  }
  return points;
}

interface Route {
  line: Line;
  ring: Mesh;
}

function createRoute(parent: Object3D, to: City, radius: number): Route {
  const a = latLonToVector(ORIGIN.lat, ORIGIN.lon);
  const b = latLonToVector(to.lat, to.lon);
  const line = new Line(
    new BufferGeometry().setFromPoints(arcPoints(a, b, radius)),
    new LineBasicMaterial({ transparent: true }),
  );
  const ring = new Mesh(
    new RingGeometry(0.8, 1, 32),
    new MeshBasicMaterial({ transparent: true, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }),
  );
  ring.position.copy(b).multiplyScalar(radius * 1.002);
  ring.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), b));
  parent.add(line, ring);
  return { line, ring };
}

function applyPhase(route: Route, phase: number): void {
  const material = route.line.material as LineBasicMaterial;
  const ringMaterial = route.ring.material as MeshBasicMaterial;
  const ripple = Math.min(1, Math.max(0, (phase - 0.4) / 0.2));
  route.line.visible = phase < 0.8;
  route.ring.visible = phase >= 0.4 && phase < 0.6;
  material.opacity = phase < 0.6 ? 1 : Math.max(0, 1 - (phase - 0.6) / 0.2);
  route.line.geometry.setDrawRange(0, phase < 0.4 ? Math.ceil((phase / 0.4) * ARC_POINTS) : ARC_POINTS);
  route.ring.scale.setScalar(0.01 + ripple * RIPPLE_SIZE);
  ringMaterial.opacity = 1 - ripple;
}

export interface Routes {
  update(timeMs: number): void;
  showAll(): void;
  setColor(color: Color): void;
}

export function createRoutes(parent: Object3D, radius: number): Routes {
  const routes = DESTINATIONS.map((city) => createRoute(parent, city, radius));
  return {
    update(timeMs) {
      routes.forEach((route, i) => applyPhase(route, routePhase(i, routes.length, timeMs)));
    },
    showAll() {
      routes.forEach((route) => {
        applyPhase(route, 0.5);
        route.ring.visible = false;
      });
    },
    setColor(color) {
      routes.forEach((route) => {
        (route.line.material as LineBasicMaterial).color.copy(color);
        (route.ring.material as MeshBasicMaterial).color.copy(color);
      });
    },
  };
}
