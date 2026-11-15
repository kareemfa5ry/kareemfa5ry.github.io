interface Stage {
  label: string;
  detail?: string;
}

interface Shot {
  type: string;
  duration_ms: number;
  caption: string;
  params: { heading?: string; stages: Stage[] };
}

export interface Pipeline {
  heading: string;
  caption: string;
  stages: Stage[];
}

// Which projects have a rendered demo: public/demos/<slug>/spec.json exists at build time.
const specs = import.meta.glob<{ shots: Shot[] }>("/public/demos/*/spec.json", {
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

// Every pipeline shot of a project's demo, in spec order: the one home of "how the work flows".
export function pipelines(slug: string): Pipeline[] {
  const spec = specs[`/public/demos/${slug}/spec.json`];
  return (spec?.shots ?? [])
    .filter((shot) => shot.type === "pipeline")
    .map(({ caption, params }) => ({ heading: params.heading ?? "How it works", caption, stages: params.stages }));
}

// The demo iframe attributes, one home for the project page and the in-place player on the home page.
export function demoFrame(slug: string, title: string) {
  return {
    src: `/demos/${slug}/`,
    title: `Animated walkthrough: ${title}`,
    loading: "lazy" as const,
    allow: "",
    referrerpolicy: "same-origin" as const,
  };
}
