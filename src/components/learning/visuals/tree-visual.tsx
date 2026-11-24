// Renders the `tree` lesson visual: node/edge tree with a highlighted walk,
// traversal order, heap comparison or trie prefix path.

import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const BINARY_EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
];

const TRIE_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 4],
];

function stepDelay(index: number, ms = 380): CSSProperties {
  return { animationDelay: `${index * ms}ms` };
}

export function TreeVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "walk";
  const heap = variant === "heap";
  const fallbackLabels = heap
    ? ["90", "72", "58", "41", "35", "29", "17"]
    : variant === "trie"
      ? ["c", "a", "t", "s", "r"]
      : ["8", "4", "12", "2", "6", "10", "14"];
  const labels = config.data?.labels?.length ? config.data.labels : fallbackLabels;
  const labelsAreShort = labels.every((label) => label.length <= 3);
  const rawEdges = config.data?.edges?.length
    ? config.data.edges
    : variant === "trie"
      ? TRIE_EDGES
      : BINARY_EDGES;
  const edges = rawEdges.filter(
    ([parent, child]) =>
      parent !== child &&
      parent >= 0 &&
      child >= 0 &&
      parent < labels.length &&
      child < labels.length,
  );

  const children = new Map<number, number[]>();
  const parentOf = new Map<number, number>();
  for (const [parent, child] of edges) {
    const list = children.get(parent) ?? [];
    list.push(child);
    children.set(parent, list);
    if (!parentOf.has(child)) parentOf.set(child, parent);
  }

  const childSet = new Set(edges.map(([, child]) => child));
  const root = labels.findIndex((_, index) => !childSet.has(index));

  const levels: number[][] = [];
  const seen = new Set<number>([root < 0 ? 0 : root]);
  let frontier = [root < 0 ? 0 : root];
  while (frontier.length > 0 && levels.length < 5) {
    levels.push(frontier);
    const next: number[] = [];
    for (const node of frontier) {
      for (const child of children.get(node) ?? []) {
        if (!seen.has(child)) {
          seen.add(child);
          next.push(child);
        }
      }
    }
    frontier = next;
  }

  const levelOf = new Map<number, number>();
  levels.forEach((nodes, depth) => nodes.forEach((node) => levelOf.set(node, depth)));
  const leaves = levels.flat().filter((node) => (children.get(node)?.length ?? 0) === 0);
  const positions = new Map<number, number>();
  const gap = 260 / Math.max(1, leaves.length);
  leaves.forEach((node, index) => positions.set(node, 30 + gap * (index + 0.5)));
  for (let depth = levels.length - 1; depth >= 0; depth -= 1) {
    for (const node of levels[depth] ?? []) {
      if (positions.has(node)) continue;
      const childXs = (children.get(node) ?? [])
        .map((child) => positions.get(child))
        .filter((x): x is number => x !== undefined);
      positions.set(
        node,
        childXs.length > 0
          ? childXs.reduce((sum, x) => sum + x, 0) / childXs.length
          : 160,
      );
    }
  }

  const leaf = leaves[0] ?? 0;
  const path: number[] = [];
  for (let node: number | undefined = leaf; node !== undefined; node = parentOf.get(node)) {
    path.unshift(node);
    if (path.length > 8) break;
  }

  const order = variant === "traversal" ? levels.flat() : path;
  const highlight = heap ? levels.slice(0, 2).flat() : order;
  const highlighted = new Set(highlight);
  const nodeY = (node: number) => 28 + (levelOf.get(node) ?? 0) * 44;
  const height = 30 + (levels.length - 1) * 44 + 30;

  const numericLabel = (value: string | undefined) => {
    if (!value) return Number.NaN;
    const bengali = "০১২৩৪৫৬৭৮৯";
    return Number(value.replace(/[০-৯]/g, (digit) => String(bengali.indexOf(digit))));
  };
  const heapValues = labels.map(numericLabel);
  const heapComparable = heapValues.every((value) => Number.isFinite(value));
  const heapOrder =
    !heapComparable ||
    edges.every(([parent, child]) => (heapValues[parent] ?? 0) <= (heapValues[child] ?? 0))
      ? "≤"
      : "≥";
  const legend =
    variant === "traversal" ? "visit order" : heap ? `parent ${heapOrder} child` : variant === "trie" ? "prefix path" : "root → leaf";

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <svg
          viewBox={`0 0 320 ${Math.max(120, height)}`}
          role="presentation"
          className={cn(
            "mx-auto block h-auto w-full",
            compact ? "max-w-[280px]" : "max-w-[340px]",
          )}
        >
          {edges.map(([parent, child], index) => {
            const x1 = positions.get(parent);
            const x2 = positions.get(child);
            if (x1 === undefined || x2 === undefined) return null;
            const active = highlighted.has(parent) && highlighted.has(child);
            return (
              <line
                key={`${parent}-${child}-${index}`}
                x1={x1}
                y1={nodeY(parent) + 15}
                x2={x2}
                y2={nodeY(child) - 15}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "stroke-primary" : "stroke-border"}
              />
            );
          })}

          {levels.flat().map((node) => {
            const x = positions.get(node);
            if (x === undefined) return null;
            const label = labels[node] ?? String(node);
            const active = highlighted.has(node);
            return (
              <g key={node} className={active ? "lv-pop" : undefined} style={active ? stepDelay(highlight.indexOf(node)) : undefined}>
                <circle cx={x} cy={nodeY(node)} r={15} strokeWidth={1.5}
                  className={active ? "fill-primary/10 stroke-primary" : "fill-card stroke-border"} />
                <text x={x} y={nodeY(node)} textAnchor="middle" dominantBaseline="central"
                  fontSize={label.length > 2 ? 12 : 13} fontWeight={active ? 600 : 500}
                  className={active ? "fill-primary" : "fill-foreground"}>
                  {labelsAreShort ? label.slice(0, 3) : node + 1}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <span className="font-mono uppercase tracking-[0.14em]">{legend}</span>
          {highlight.slice(0, 7).map((node, index) => (
            <span key={`${node}-${index}`} className="lv-rise rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground" style={stepDelay(index, 180)}>
              {labels[node] ?? node}
            </span>
          ))}
        </div>

        {!labelsAreShort ? (
          <div className="flex max-w-full flex-wrap items-center justify-center gap-1 text-[10px] text-muted-foreground">
            {labels.map((label, index) => (
              <span key={`${label}-${index}`} className="max-w-full truncate rounded border border-border bg-card px-1 py-0.5">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </VisualFrame>
  );
}
