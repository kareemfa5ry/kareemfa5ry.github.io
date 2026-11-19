/**
 * Owns the globe's route arcs: the city lists, the lat/lon to sphere mapping shared with the land dots, and the
 * animated great-circle arcs (draw in, ripple at the destination, fade out, idle). Cairo's routes are fixed; a few
 * more fly between a random pair of world cities, picked again at each launch.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
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
/** Random routes: how many, and their clock offset, half a cycle out of step so they fill Cairo's gaps. */
const RANDOM_ROUTES = 4;
const RANDOM_OFFSET_MS = CYCLE_MS / 2;
/** A random pair's arc, in radians: longer than London-Paris (0.05), short of nearly opposite cities (pi). */
const MIN_ARC = 0.3;
const MAX_ARC = 2.8;
const PICK_TRIES = 8;
const RING_FACING = new Vector3(0, 0, 1);

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
/** Endpoints for the random routes: Cairo's destinations plus the other continents (Cairo has its own 8 arcs). */
export const WORLD_CITIES: City[] = [
  ...DESTINATIONS,
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Toronto", lat: 43.65, lon: -79.38 },
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
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

/** Two different cities: the second index skips past the first, so a pair never repeats one city. */
function anyPair(cities: City[], random: () => number): [City, City] {
  const first = Math.floor(random() * cities.length);
  const second = (first + 1 + Math.floor(random() * (cities.length - 1))) % cities.length;
  return [cities[first], cities[second]];
}

const arcAngle = ([a, b]: [City, City]) => latLonToVector(a.lat, a.lon).angleTo(latLonToVector(b.lat, b.lon));
const fitsGlobe = (pair: [City, City]) => arcAngle(pair) >= MIN_ARC && arcAngle(pair) <= MAX_ARC;

/**
 * The two ends of a random route, drawn from `cities` with `random` (0 to 1, like Math.random). Re-picks a pair
 * too short to see or nearly opposite (unstable great circle); after PICK_TRIES it keeps the last distinct pair.
 */
export function pickPair(cities: City[], random: () => number): [City, City] {
  let pair = anyPair(cities, random);
  for (let tries = 1; tries < PICK_TRIES && !fitsGlobe(pair); tries++) pair = anyPair(cities, random);
  return pair;
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

/** Points the route's arc and destination ring from `from` to `to`, rewriting its buffer in place. */
function aim(route: Route, from: City, to: City, radius: number): void {
  const a = latLonToVector(from.lat, from.lon);
  const b = latLonToVector(to.lat, to.lon);
  route.line.geometry.setFromPoints(arcPoints(a, b, radius)).computeBoundingSphere();
  route.ring.position.copy(b).multiplyScalar(radius * 1.002);
  route.ring.quaternion.setFromUnitVectors(RING_FACING, b);
}

function createRoute(parent: Object3D, from: City, to: City, radius: number): Route {
  const geometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(ARC_POINTS * 3, 3));
  const line = new Line(geometry, new LineBasicMaterial({ transparent: true }));
  const ring = new Mesh(
    new RingGeometry(0.8, 1, 32),
    new MeshBasicMaterial({ transparent: true, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }),
  );
  const route = { line, ring };
  aim(route, from, to, radius);
  parent.add(line, ring);
  return route;
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

/** A route between random cities; `phase` is the last one drawn, so a drop back to 0 marks a new launch. */
interface RandomRoute extends Route {
  phase: number;
}

function createRandomRoute(parent: Object3D, radius: number): RandomRoute {
  return { ...createRoute(parent, ...pickPair(WORLD_CITIES, Math.random), radius), phase: 0 };
}

function updateRandom(route: RandomRoute, phase: number, radius: number): void {
  if (phase < route.phase) aim(route, ...pickPair(WORLD_CITIES, Math.random), radius);
  route.phase = phase;
  applyPhase(route, phase);
}

export interface Routes {
  update(timeMs: number): void;
  showAll(): void;
  setColor(color: Color): void;
}

export function createRoutes(parent: Object3D, radius: number): Routes {
  const fixed = DESTINATIONS.map((city) => createRoute(parent, ORIGIN, city, radius));
  const random = Array.from({ length: RANDOM_ROUTES }, () => createRandomRoute(parent, radius));
  const all: Route[] = [...fixed, ...random];
  return {
    update(timeMs) {
      fixed.forEach((route, i) => applyPhase(route, routePhase(i, fixed.length, timeMs)));
      random.forEach((route, i) =>
        updateRandom(route, routePhase(i, random.length, timeMs + RANDOM_OFFSET_MS), radius),
      );
    },
    showAll() {
      all.forEach((route) => {
        applyPhase(route, 0.5);
        route.ring.visible = false;
      });
    },
    setColor(color) {
      all.forEach((route) => {
        (route.line.material as LineBasicMaterial).color.copy(color);
        (route.ring.material as MeshBasicMaterial).color.copy(color);
      });
    },
  };
}
