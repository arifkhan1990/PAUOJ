import Link from "next/link";
import { cn } from "@/lib/utils";
import { difficultyMeta } from "@/lib/difficulty";
import type { RelatedProblemItem } from "@/lib/types";

const DIFFICULTY_DOT: Record<string, string> = {
  EASY: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HARD: "bg-rose-500",
  EXPERT: "bg-foreground",
};

/** Related problems as compact pills; hidden when nothing shares a tag. */
export function MoreChallenges({
  problems,
}: {
  problems: RelatedProblemItem[];
}) {
  if (problems.length === 0) return null;

  return (
    <section className="mt-6" aria-labelledby="more-challenges-heading">
      <h2 id="more-challenges-heading" className="text-sm font-semibold">
        More challenges
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {problems.map((problem) => (
          <li key={problem.slug} className="min-w-0 max-w-full">
            <Link
              href={`/problems/${problem.slug}`}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-9"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  DIFFICULTY_DOT[problem.difficulty] ?? "bg-foreground",
                )}
              />
              <span className="truncate">{problem.title}</span>
              <span className="sr-only">
                {" "}
                — {difficultyMeta(problem.difficulty).label} difficulty
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
