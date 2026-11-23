import { Badge } from "@/components/ui/badge";
import type { StudyDifficultyCounts } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

const SEGMENTS: ReadonlyArray<{
  key: keyof StudyDifficultyCounts;
  label: string;
  dotClassName: string;
  alwaysVisible: boolean;
}> = [
  {
    key: "EASY",
    label: "Easy",
    dotClassName: "bg-emerald-500",
    alwaysVisible: true,
  },
  {
    key: "MEDIUM",
    label: "Medium",
    dotClassName: "bg-amber-500",
    alwaysVisible: true,
  },
  {
    key: "HARD",
    label: "Hard",
    dotClassName: "bg-rose-500",
    alwaysVisible: true,
  },
  {
    key: "EXPERT",
    label: "Expert",
    dotClassName: "bg-foreground",
    alwaysVisible: false,
  },
];

/** Compact difficulty pills with text counts, readable without colour. */
export function DifficultyMix({
  counts,
  className,
}: {
  counts: StudyDifficultyCounts;
  className?: string;
}) {
  const visible = SEGMENTS.filter(
    (segment) => segment.alwaysVisible || counts[segment.key] > 0,
  );

  return (
    <ul
      aria-label="Difficulty mix"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {visible.map((segment) => (
        <li key={segment.key}>
          <Badge
            variant="outline"
            className="gap-1.5 font-normal text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", segment.dotClassName)}
            />
            {segment.label}
            <span className="font-mono tabular-nums text-foreground/80">
              {counts[segment.key]}
            </span>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
