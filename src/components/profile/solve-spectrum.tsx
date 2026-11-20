"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Layers3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

const META: Record<
  Difficulty,
  {
    label: string;
    strokeClassName: string;
    textClassName: string;
    ringClassName: string;
  }
> = {
  EASY: {
    label: "Easy",
    strokeClassName: "stroke-emerald-500",
    textClassName: "text-emerald-700 dark:text-emerald-300",
    ringClassName: "ring-emerald-500/40",
  },
  MEDIUM: {
    label: "Medium",
    strokeClassName: "stroke-amber-500",
    textClassName: "text-amber-700 dark:text-amber-300",
    ringClassName: "ring-amber-500/40",
  },
  HARD: {
    label: "Hard",
    strokeClassName: "stroke-rose-500",
    textClassName: "text-rose-700 dark:text-rose-300",
    ringClassName: "ring-rose-500/40",
  },
  EXPERT: {
    label: "Expert",
    strokeClassName: "stroke-sky-500",
    textClassName: "text-sky-700 dark:text-sky-300",
    ringClassName: "ring-sky-500/40",
  },
};

type SpectrumSegment = {
  difficulty: Difficulty;
  percent: number;
  offset: number;
};

export function SolveSpectrum({
  solved,
  totals,
  attemptedCount,
  solvedCount,
  className,
}: {
  solved: Record<Difficulty, number>;
  totals: Record<Difficulty, number>;
  attemptedCount: number;
  solvedCount: number;
  className?: string;
}) {
  const [active, setActive] = useState<Difficulty | null>(null);
  const totalProblems = Object.values(totals).reduce(
    (sum, value) => sum + value,
    0,
  );
  const segments = DIFFICULTIES.reduce<SpectrumSegment[]>(
    (result, difficulty) => {
      const percent =
        totalProblems > 0 ? (solved[difficulty] / totalProblems) * 100 : 0;
      const offset = result.reduce((sum, segment) => sum + segment.percent, 0);
      return [...result, { difficulty, percent, offset }];
    },
    [],
  );

  const activeMeta = active ? META[active] : null;
  const activeSolved = active ? solved[active] : solvedCount;
  const activeTotal = active ? totals[active] : totalProblems;
  const activePercent =
    activeTotal > 0
      ? Math.min(100, Math.round((activeSolved / activeTotal) * 100))
      : 0;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers3 className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Solve spectrum
            </p>
            <h2 className="text-sm font-semibold">Problem coverage</h2>
          </div>
        </div>
        <Link
          href="/problems"
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Practice
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-6 sm:flex-row">
        <div className="relative grid size-44 shrink-0 place-items-center">
          <svg
            viewBox="0 0 140 140"
            className="size-44 -rotate-90"
            role="img"
            aria-label={`${solvedCount} of ${totalProblems} public problems solved`}
            onMouseLeave={() => setActive(null)}
          >
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="11"
            />
            {segments.map((segment) => {
              if (segment.percent <= 0) return null;
              const isActive = active === segment.difficulty;
              const dash = Math.max(0, segment.percent - 2.5);
              return (
                <g
                  key={segment.difficulty}
                  onMouseEnter={() => setActive(segment.difficulty)}
                >
                  {isActive ? (
                    <circle
                      cx="70"
                      cy="70"
                      r="56"
                      fill="none"
                      pathLength={100}
                      strokeDasharray={`${dash} ${100 - dash}`}
                      strokeDashoffset={-segment.offset}
                      strokeLinecap="round"
                      strokeWidth={24}
                      className={cn(
                        META[segment.difficulty].strokeClassName,
                        "pointer-events-none opacity-15",
                      )}
                    />
                  ) : null}
                  <circle
                    cx="70"
                    cy="70"
                    r="56"
                    fill="none"
                    pathLength={100}
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={-segment.offset}
                    strokeLinecap="round"
                    className={cn(
                      META[segment.difficulty].strokeClassName,
                      active && !isActive ? "opacity-35" : "opacity-100",
                    )}
                    style={{
                      strokeWidth: isActive ? 15 : 11,
                      transition:
                        "stroke-width 200ms ease, opacity 200ms ease",
                    }}
                  />
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            {activeMeta ? (
              <div>
                <p
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-[0.14em]",
                    activeMeta.textClassName,
                  )}
                >
                  {activeMeta.label}
                </p>
                <p className="mt-1 font-mono text-[22px] font-semibold leading-none tabular-nums">
                  {activeSolved}
                  <span className="text-sm font-medium text-muted-foreground">
                    /{activeTotal}
                  </span>
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[9px] font-medium tabular-nums",
                    activeMeta.textClassName,
                  )}
                >
                  {activePercent}% solved
                </p>
              </div>
            ) : (
              <div>
                <p className="font-mono text-[26px] font-semibold leading-none tabular-nums">
                  {solvedCount}
                  <span className="text-sm font-medium text-muted-foreground">
                    /{totalProblems}
                  </span>
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Solved
                </p>
              </div>
            )}
          </div>

          {!active ? (
            <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-[10px] text-muted-foreground">
              {attemptedCount} Attempting
            </p>
          ) : null}
        </div>

        <div className="grid w-full gap-2 sm:w-48">
          {DIFFICULTIES.map((difficulty) => {
            const meta = META[difficulty];
            const isActive = active === difficulty;
            return (
              <div
                key={difficulty}
                className={cn(
                  "rounded-lg px-3 py-2 text-center transition-[transform,background-color,box-shadow] duration-200 ease-out",
                  isActive
                    ? cn(
                        "-translate-y-0.5 bg-muted ring-1 ring-inset shadow-sm",
                        meta.ringClassName,
                      )
                    : "bg-muted/60",
                )}
                title={`${meta.label}: ${solved[difficulty]} of ${totals[difficulty]} solved`}
                onMouseEnter={() => setActive(difficulty)}
                onMouseLeave={() => setActive(null)}
              >
                <p className={cn("text-[11px] font-medium", meta.textClassName)}>
                  {meta.label}
                </p>
                <p className="mt-1 font-mono text-[12px] font-semibold leading-none tabular-nums">
                  {solved[difficulty]}
                  <span className="font-normal text-muted-foreground">
                    /{totals[difficulty]}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
