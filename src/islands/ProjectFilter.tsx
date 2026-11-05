// Filter-by-skill chips for the server-rendered projects list. It renders only the chips and the count; it shows
// and hides the existing [data-project] entries with their `hidden` attribute. Without JavaScript the chip bar
// stays hidden and every project shows.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import styles from "./ProjectFilter.module.css";

interface SkillGroupOption {
  id: string;
  label: string;
}

interface FilterableProject {
  slug: string;
  title: string;
  skills: string[];
}

interface Props {
  /** Skill groups in display order. */
  groups: SkillGroupOption[];
  /** Projects in display order, each with the skill group ids it proves. */
  projects: FilterableProject[];
}

const subscribeNever = () => () => {};

/** False in the server HTML and during hydration, true once React runs in the browser. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

export default function ProjectFilter({ groups, projects }: Props) {
  const hydrated = useHydrated();
  const [active, setActive] = useState<string | null>(null);
  const shown = useMemo(
    () => projects.filter((project) => active === null || project.skills.includes(active)),
    [active, projects],
  );
  const provenGroups = groups.filter((group) => projects.some((project) => project.skills.includes(group.id)));

  useEffect(() => {
    const visible = new Set(shown.map((project) => project.slug));
    document.querySelectorAll<HTMLElement>("[data-project]").forEach((entry) => {
      entry.hidden = !visible.has(entry.dataset.project ?? "");
    });
  }, [shown]);

  return (
    <div className={styles.bar} hidden={!hydrated}>
      <div className={styles.chips} role="group" aria-label="Filter projects by skill">
        {provenGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            className={styles.chip}
            aria-pressed={active === group.id}
            onClick={() => setActive(active === group.id ? null : group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>
      <p className={styles.count} aria-live="polite">
        {shown.length} of {projects.length} projects
      </p>
    </div>
  );
}
