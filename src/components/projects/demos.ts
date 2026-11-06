// Which projects have a rendered demo: public/demos/<slug>/spec.json exists at build time.
const specs = import.meta.glob("/public/demos/*/spec.json");

export function hasDemo(slug: string): boolean {
  return `/public/demos/${slug}/spec.json` in specs;
}
