import { Sparkles, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningModuleSummary } from "@/lib/learning/types";
import { ModuleCard } from "./module-card";

/**
 * Free career-toolkit modules. Rendered only when at least one such module is
 * registered, so the curriculum page is unchanged until the tracks go live.
 */
export function CareerToolkitSection({
  modules,
  signedIn,
}: {
  modules: LearningModuleSummary[];
  signedIn: boolean;
}) {
  if (modules.length === 0) return null;

  return (
    <section
      id="career-toolkit"
      aria-labelledby="career-toolkit-title"
      className="mt-10 scroll-mt-24"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-primary">
            <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
            Career toolkit
          </p>
          <h2
            id="career-toolkit-title"
            className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Career toolkit · free
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The tools you will use on day one: Git/GitHub and Docker/CI-CD. Free,
            no paywall.
          </p>
        </div>
        <Badge variant="success" className="self-start lg:self-auto">
          <Sparkles className="size-3" aria-hidden="true" />
          Free · no paywall
        </Badge>
      </div>

      <ul
        aria-label="Free career toolkit modules"
        className="mt-6 grid gap-4 md:grid-cols-2"
      >
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} signedIn={signedIn} />
        ))}
      </ul>
    </section>
  );
}
