import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Card } from "@/components/ui/card";
import type { RelatedProblemItem } from "@/lib/types";

export function RelatedProblems({
  problems,
}: {
  problems: RelatedProblemItem[];
}) {
  if (problems.length === 0) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Practice more like this</h2>
      </div>
      <ul className="mt-3 space-y-2">
        {problems.map((problem) => (
          <li key={problem.slug}>
            <Link
              href={`/problems/${problem.slug}`}
              className="block rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <span className="line-clamp-1 text-xs font-medium">
                {problem.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="font-mono">{problem.points} pts</span>
                <span>
                  {problem.sharedTags} shared{" "}
                  {problem.sharedTags === 1 ? "tag" : "tags"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
