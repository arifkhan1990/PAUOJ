// Renders the `git` lesson visual: a commit DAG with main/feature lanes, a
// merge commit, or a recover edge.

import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };
type Commit = { id: string; x: number; y: number; lane: "main" | "feature" };

const COMMITS: Commit[] = [
  { id: "A", x: 40, y: 112, lane: "main" },
  { id: "B", x: 95, y: 112, lane: "main" },
  { id: "F", x: 122, y: 52, lane: "feature" },
  { id: "G", x: 178, y: 52, lane: "feature" },
  { id: "C", x: 150, y: 112, lane: "main" },
  { id: "D", x: 205, y: 112, lane: "main" },
  { id: "E", x: 265, y: 112, lane: "main" },
];

const MAIN_EDGES: Array<[string, string]> = [
  ["A", "B"],
  ["B", "C"],
  ["C", "D"],
  ["D", "E"],
];

function curve(from: Commit, to: Commit): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x + 18} ${midY}, ${to.x - 18} ${midY}, ${to.x} ${to.y}`;
}

export function GitVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "merge";
  const labels = config.data?.labels ?? [];
  const linear = variant === "history";
  const messages = new Map<string, string>();
  if (variant !== "pr") {
    const prefixed = labels.some((label) => /^(main|feature):/i.test(label));
    const mergeLabel = labels.find((label) => /merge/i.test(label));
    if (prefixed) {
      labels.filter((label) => /^main:/i.test(label) && label !== mergeLabel).slice(0, 3)
        .forEach((label, index) => messages.set(["A", "B", "C"][index] ?? "", label));
      labels.filter((label) => /^feature:/i.test(label)).slice(0, 2)
        .forEach((label, index) => messages.set(["F", "G"][index] ?? "", label));
    } else {
      labels.slice(0, 5).forEach((label, index) => messages.set(["A", "B", "C", "D", "E"][index] ?? "", label));
    }
    if (mergeLabel) messages.set("D", mergeLabel);
  }
  const byId = new Map(COMMITS.map((commit) => [commit.id, commit]));
  const branchFrom = byId.get("B") ?? COMMITS[0];
  const branchTo = byId.get("F") ?? COMMITS[2];
  const mergeFrom = byId.get("G") ?? COMMITS[3];
  const mergeTo = byId.get("D") ?? COMMITS[5];
  const featureStart = byId.get("F") ?? COMMITS[2];
  const featureEnd = byId.get("G") ?? COMMITS[3];
  const visibleCommits = linear ? COMMITS.filter((commit) => commit.lane === "main") : COMMITS;
  const focus = linear || variant === "recover" ? new Set(["E"]) : new Set(["F", "G", "D"]);
  const note = linear
    ? "linear history → one snapshot per commit"
    : variant === "pr"
      ? "PR approved → merge commit"
      : variant === "recover"
        ? "reflog → reset --hard"
        : "feature → merge commit";

  const renderCommit = (commit: Commit) => {
    const active = focus.has(commit.id);
    const isFeature = commit.lane === "feature";
    const isMerge = commit.id === "D" && variant !== "recover" && !linear;
    return (
      <g
        key={commit.id}
        className={cn(active && (variant === "recover" ? "lv-glow" : "lv-pop"))}
        style={
          active
            ? ({
                animationDelay:
                  variant === "merge"
                    ? commit.id === "F"
                      ? "650ms"
                      : commit.id === "G"
                        ? "950ms"
                        : "1250ms"
                    : "900ms",
              } as CSSProperties)
            : undefined
        }
      >
        <circle
          cx={commit.x}
          cy={commit.y}
          r={11}
          strokeWidth={1.6}
          className={cn(
            isMerge && "fill-primary/15 stroke-primary",
            !isMerge && isFeature && "fill-accent/10 stroke-accent",
            !isMerge && !isFeature && "fill-card stroke-border",
            active && !isMerge && !isFeature && "fill-primary/10 stroke-primary",
          )}
        />
        <text
          x={commit.x}
          y={commit.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          className={cn(
            isMerge
              ? "fill-primary"
              : isFeature
                ? "fill-accent"
                : "fill-muted-foreground",
          )}
        >
          {commit.id}
        </text>
      </g>
    );
  };

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-1">
        <svg
          viewBox="0 0 320 158"
          role="presentation"
          className={cn("mx-auto block h-auto w-full", compact ? "max-w-[280px]" : "max-w-[340px]")}
        >
          {MAIN_EDGES.map(([fromId, toId]) => {
            const from = byId.get(fromId);
            const to = byId.get(toId);
            if (!from || !to) return null;
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.x + 11}
                y1={from.y}
                x2={to.x - 11}
                y2={to.y}
                strokeWidth={1.6}
                strokeLinecap="round"
                className="stroke-border"
              />
            );
          })}

          {!linear ? (
            <>
          <path
            d={curve(branchFrom, branchTo)}
            fill="none"
            strokeWidth={1.6}
            className="lv-draw stroke-accent"
            style={{ animationDelay: "300ms", "--lv-length": 70 } as CSSProperties}
          />
          <path
            d={curve(mergeFrom, mergeTo)}
            fill="none"
            strokeWidth={1.8}
            className="lv-draw stroke-primary"
            style={{ animationDelay: "900ms", "--lv-length": 70 } as CSSProperties}
          />
          <line
            x1={featureStart.x + 11}
            y1={52}
            x2={featureEnd.x - 11}
            y2={52}
            strokeWidth={1.6}
            className="stroke-accent/70"
          />
            </>
          ) : null}

          {variant === "recover" ? (
            <g>
              <path
                d="M 265 112 C 290 92, 300 78, 300 64"
                fill="none"
                strokeWidth={1.4}
                strokeDasharray="4 3"
                className="stroke-destructive/70"
              />
              <circle
                cx={300}
                cy={52}
                r={9}
                className="fill-destructive/10 stroke-destructive/70"
                strokeWidth={1.4}
              />
              <text
                x={300}
                y={52}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                className="fill-destructive"
              >
                ↺
              </text>
            </g>
          ) : null}

          {visibleCommits.map(renderCommit)}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full border border-primary bg-primary/20" />
            main
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full border border-accent bg-accent/20" />
            feature
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide">{note}</span>
        </div>

        {messages.size > 0 ? (
          <div className="flex max-w-full flex-wrap justify-center gap-1">
            {visibleCommits.filter((commit) => messages.has(commit.id)).map((commit, index) => (
              <span key={commit.id} className="lv-rise max-w-[9rem] truncate rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground" style={{ animationDelay: `${index * 160}ms` }}>
                {commit.id} · {messages.get(commit.id)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </VisualFrame>
  );
}
