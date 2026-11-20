import { Code2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getLanguage } from "@/lib/languages";
import type { ProfileLanguageStat } from "@/lib/profile-types";
import { cn, formatPercent } from "@/lib/utils";

const LANGUAGE_COLORS: Record<string, string> = {
  cpp: "#0ea5e9",
  c: "#64748b",
  python: "#f59e0b",
  java: "#f43f5e",
  javascript: "#eab308",
  csharp: "#8b5cf6",
  go: "#14b8a6",
  php: "#6366f1",
  kotlin: "#f97316",
  swift: "#ef4444",
};

type LanguagePoint = {
  language: string;
  label: string;
  submissions: number;
  accepted: number;
  share: number;
  offset: number;
  color: string;
};

export function LanguageAnalytics({ stats }: { stats: ProfileLanguageStat[] }) {
  const total = stats.reduce((sum, stat) => sum + stat.submissions, 0);
  const points = stats
    .filter((stat) => stat.submissions > 0)
    .sort((left, right) => right.submissions - left.submissions)
    .reduce<LanguagePoint[]>((result, stat) => {
      const share = total > 0 ? (stat.submissions / total) * 100 : 0;
      const offset = result.reduce((sum, point) => sum + point.share, 0);
      return [
        ...result,
        {
          language: stat.language,
          label: getLanguage(stat.language).shortLabel,
          submissions: stat.submissions,
          accepted: stat.accepted,
          share,
          offset,
          color: LANGUAGE_COLORS[stat.language] ?? "#94a3b8",
        },
      ];
    }, []);

  return (
    <Card className="flex h-full flex-col rounded-2xl shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-sky-500/10 via-muted/15 to-transparent px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Code2 className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Languages
            </p>
            <h2 className="text-sm font-semibold">Language analytics</h2>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {stats.length} {stats.length === 1 ? "language" : "languages"}
        </span>
      </div>

      {points.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-muted-foreground">
          Submit a solution to see your language mix.
        </p>
      ) : (
        <div className="grid flex-1 items-center gap-4 p-5 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="animate-enter relative mx-auto h-56 w-full max-w-64">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`Language distribution across ${total} submissions`}
            >
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="24"
              />
              {points.map((point) => {
                const dash =
                  points.length === 1
                    ? 100
                    : Math.max(0, point.share - 1.5);
                return (
                  <circle
                    key={point.language}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    pathLength={100}
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={-point.offset}
                    strokeLinecap="round"
                    strokeWidth="24"
                    stroke={point.color}
                  >
                    <title>{`${point.label}: ${point.accepted}/${point.submissions} accepted`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-mono text-2xl font-semibold leading-none tabular-nums">
                  {total}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  submissions
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-2">
            {points.map((point) => (
              <li
                key={point.language}
                className="flex items-center justify-between gap-2 text-[10px]"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: point.color }}
                  />
                  <span className="truncate font-medium">{point.label}</span>
                </span>
                <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                  {point.accepted}/{point.submissions}{" "}
                  <span
                    className={cn(
                      "ml-1",
                      point.share >= 50
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {formatPercent(point.share, 0)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
