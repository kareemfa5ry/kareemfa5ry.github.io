// Which projects have a rendered demo: public/demos/<slug>/spec.json exists at build time.
const specs = import.meta.glob<{ shots: { duration_ms: number }[] }>("/public/demos/*/spec.json", {
  eager: true,
  import: "default",
});

export function hasDemo(slug: string): boolean {
  return `/public/demos/${slug}/spec.json` in specs;
}

// Total demo length in whole seconds: the sum of the spec's shot durations.
export function demoDuration(slug: string): number {
  const spec = specs[`/public/demos/${slug}/spec.json`];
  return Math.round(spec.shots.reduce((ms, shot) => ms + shot.duration_ms, 0) / 1000);
}
