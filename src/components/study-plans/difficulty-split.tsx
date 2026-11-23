import type { StudyDifficultyCounts } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

const SEGMENTS: ReadonlyArray<{
  key: keyof StudyDifficultyCounts;
  label: string;
  barClassName: string;
  dotClassName: string;
  alwaysVisible: boolean;
}> = [
  {
    key: "EASY",
    label: "Easy",
    barClassName: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
    alwaysVisible: true,
  },
  {
    key: "MEDIUM",
    label: "Medium",
    barClassName: "bg-amber-500",
    dotClassName: "bg-amber-500",
    alwaysVisible: true,
  },
  {
    key: "HARD",
    label: "Hard",
    barClassName: "bg-rose-500",
    dotClassName: "bg-rose-500",
    alwaysVisible: true,
  },
  {
    key: "EXPERT",
    label: "Expert",
    barClassName: "bg-foreground",
    dotClassName: "bg-foreground",
    alwaysVisible: false,
  },
];

/** Stacked difficulty split plus a text legend, so the mix is readable without colour. */
export function DifficultySplit({
  counts,
  className,
}: {
  counts: StudyDifficultyCounts;
  className?: string;
}) {
  const visible = SEGMENTS.filter(
    (segment) => segment.alwaysVisible || counts[segment.key] > 0,
  );
  const total = visible.reduce((sum, segment) => sum + counts[segment.key], 0);

  return (
    <div className={className}>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        {total > 0
          ? visible
              .filter((segment) => counts[segment.key] > 0)
              .map((segment) => (
                <span
                  key={segment.key}
                  className={segment.barClassName}
                  style={{ flexGrow: counts[segment.key], flexBasis: 0 }}
                />
              ))
          : null}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {visible.map((segment) => (
          <li key={segment.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", segment.dotClassName)}
            />
            {segment.label}
            <span className="font-mono tabular-nums text-foreground/80">
              {counts[segment.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
