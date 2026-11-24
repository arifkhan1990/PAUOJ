// Renders the `graph` lesson visual: BFS, Dijkstra, MST or max flow on a small node-link diagram.

import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };
type Edges = Array<[number, number]>;

const DEFAULT_LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const DEFAULT_EDGES: Edges = [[0, 1], [0, 3], [1, 2], [1, 4], [2, 5], [3, 4], [4, 6], [5, 6]];
const DEFAULT_WEIGHTS = [4, 2, 7, 1, 3, 5, 6, 2];
const FLOW_LABELS = ["s", "a", "b", "t"];
const FLOW_EDGES: Edges = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2]];
const FLOW_WEIGHTS = [3, 2, 2, 4, 1];

function delay(index: number, ms = 420): CSSProperties {
  return { animationDelay: `${index * ms}ms` };
}

function bfsTree(nodeCount: number, edges: Edges) {
  const adjacency = new Map<number, number[]>();
  for (const [a, b] of edges) {
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  }
  const order: number[] = [], treeEdges = new Set<number>();
  const seen = new Set<number>([0]);
  const queue = [0];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    order.push(node);
    for (const next of adjacency.get(node) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
      treeEdges.add(
        edges.findIndex(([a, b]) => (a === node && b === next) || (a === next && b === node)),
      );
    }
  }
  return { order, treeEdges };
}

function shortestPath(nodeCount: number, edges: Edges, weightAt: (index: number) => number) {
  const distance = Array.from({ length: nodeCount }, () => Number.POSITIVE_INFINITY);
  const previous = Array.from({ length: nodeCount }, () => -1);
  const settled = new Set<number>();
  distance[0] = 0;
  while (settled.size < nodeCount) {
    let current = -1;
    for (let index = 0; index < nodeCount; index += 1) {
      if (!settled.has(index) && (current === -1 || distance[index] < distance[current])) current = index;
    }
    if (current === -1 || !Number.isFinite(distance[current])) break;
    settled.add(current);
    edges.forEach(([a, b], index) => {
      const next = a === current ? b : b === current ? a : -1;
      if (next === -1) return;
      const candidate = distance[current] + weightAt(index);
      if (candidate < distance[next]) {
        distance[next] = candidate;
        previous[next] = current;
      }
    });
  }
  const path: number[] = [];
  for (let cursor = nodeCount - 1; cursor !== -1 && path.length < 10; cursor = previous[cursor] ?? -1) {
    path.unshift(cursor);
  }
  return { path, distance };
}

function spanningTree(nodeCount: number, edges: Edges, weightAt: (index: number) => number) {
  const inside = new Set<number>([0]);
  const chosen = new Set<number>();
  let total = 0;
  while (inside.size < nodeCount) {
    let best = -1;
    edges.forEach(([a, b], index) => {
      if (inside.has(a) === inside.has(b)) return;
      if (best === -1 || weightAt(index) < weightAt(best)) best = index;
    });
    const edge = edges[best];
    if (!edge) break;
    inside.add(inside.has(edge[0]) ? edge[1] : edge[0]);
    chosen.add(best);
    total += weightAt(best);
  }
  return { edges: chosen, total };
}

/** Ford-Fulkerson (DFS augmenting paths) on the directed capacity graph. */
function maxFlow(nodeCount: number, edges: Edges, capacityAt: (index: number) => number) {
  const residual = Array.from({ length: nodeCount }, () => Array.from({ length: nodeCount }, () => 0));
  edges.forEach(([a, b], index) => {
    const row = residual[a];
    if (row) row[b] = (row[b] ?? 0) + capacityAt(index);
  });
  const source = 0, sink = nodeCount - 1;
  const push = (node: number, seen: boolean[], limit: number): number => {
    if (node === sink) return limit;
    seen[node] = true;
    for (let next = 0; next < nodeCount; next += 1) {
      const capacity = residual[node]?.[next] ?? 0;
      if (capacity <= 0 || seen[next]) continue;
      const sent = push(next, seen, Math.min(limit, capacity));
      if (sent <= 0) continue;
      const forward = residual[node];
      const backward = residual[next];
      if (forward) forward[next] = capacity - sent;
      if (backward) backward[node] = (backward[node] ?? 0) + sent;
      return sent;
    }
    return 0;
  };
  let total = 0;
  for (let round = 0; round < 20; round += 1) {
    const pushed = push(source, [], Number.POSITIVE_INFINITY);
    if (pushed <= 0) break;
    total += pushed;
  }
  return {
    total,
    flowByEdge: edges.map(([a, b], index) =>
      Math.max(0, capacityAt(index) - (residual[a]?.[b] ?? 0)),
    ),
  };
}

export function GraphVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "bfs";
  const flowVariant = variant === "flow";
  const labels = (config.data?.labels?.length ? config.data.labels : flowVariant ? FLOW_LABELS : DEFAULT_LABELS).slice(0, 7);
  const labelsAreShort = labels.every((label) => label.length <= 3);
  const flowSample = flowVariant && labels.length === FLOW_LABELS.length && !config.data?.edges?.length;
  const edges = (config.data?.edges?.length ? config.data.edges : flowSample ? FLOW_EDGES : DEFAULT_EDGES)
    .filter(([a, b]) => a >= 0 && b >= 0 && a < labels.length && b < labels.length && a !== b);
  const weights = config.data?.values?.length ? config.data.values : flowSample ? FLOW_WEIGHTS : DEFAULT_WEIGHTS;
  const weightAt = (index: number) => weights[index] ?? 1;
  const tree = bfsTree(labels.length, edges);
  const shortest = shortestPath(labels.length, edges, weightAt);
  const mst = spanningTree(labels.length, edges, weightAt);
  const flow = maxFlow(labels.length, edges, weightAt);
  const pathEdges = new Set(
    shortest.path.slice(1).map((node, index) =>
      edges.findIndex(([a, b]) => (a === shortest.path[index] && b === node) || (b === shortest.path[index] && a === node)),
    ),
  );
  const flowEdges = new Set(flow.flowByEdge.flatMap((amount, index) => (amount > 0 ? [index] : [])));
  const activeEdges =
    variant === "dijkstra" ? pathEdges : flowVariant ? flowEdges : variant === "mst" ? mst.edges : tree.treeEdges;

  const activeSet =
    variant === "dijkstra"
      ? new Set(shortest.path)
      : flowVariant
        ? new Set([0, labels.length - 1, ...[...flowEdges].flatMap((index) => edges[index] ?? [])])
        : variant === "mst"
          ? new Set(labels.map((_, index) => index))
          : new Set(tree.order);
  const activeOrder =
    variant === "dijkstra"
      ? shortest.path
      : flowVariant
        ? [...flowEdges].flatMap((index) => edges[index] ?? [])
        : variant === "mst"
          ? [...mst.edges].flatMap((index) => edges[index] ?? [])
          : tree.order;

  const points = labels.map((_, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, labels.length)) * Math.PI * 2;
    return { x: 160 + 112 * Math.cos(angle), y: 92 + 62 * Math.sin(angle) };
  });

  const strip = variant === "dijkstra" ? `dist → ${labels[labels.length - 1] ?? "?"} = ${shortest.distance[labels.length - 1] ?? "∞"}`
    : variant === "mst" ? `MST total = ${mst.total}`
    : flowVariant ? `max flow = ${Math.round(flow.total * 100) / 100}` : "queue order";

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <svg viewBox="0 0 320 184" role="presentation" className={cn("mx-auto block h-auto w-full", compact ? "max-w-[280px]" : "max-w-[340px]")}>
          <defs>
            <marker id="lv-graph-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L8 4 L0 8 z" className="fill-muted-foreground" />
            </marker>
          </defs>

          {edges.map(([a, b], index) => {
            const from = points[a];
            const to = points[b];
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.hypot(dx, dy) || 1;
            const active = activeEdges.has(index);
            return (
              <g key={`${a}-${b}-${index}`}>
                <line
                  x1={from.x + (dx / length) * 17} y1={from.y + (dy / length) * 17}
                  x2={to.x - (dx / length) * 17} y2={to.y - (dy / length) * 17}
                  strokeWidth={active ? 2.2 : 1.4}
                  className={active ? "stroke-primary" : "stroke-border"}
                  markerEnd={flowVariant ? "url(#lv-graph-arrow)" : undefined}
                />
                {variant === "dijkstra" || variant === "mst" || flowVariant ? (
                  <text
                    x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 3} textAnchor="middle" fontSize={12}
                    className="fill-muted-foreground stroke-card" strokeWidth={2.5} paintOrder="stroke"
                  >
                    {flowVariant ? `${flow.flowByEdge[index] ?? 0}/${weightAt(index)}` : weightAt(index)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {labels.map((label, index) => {
            const point = points[index];
            const active = activeSet.has(index);
            if (!point) return null;
            return (
              <g key={`${label}-${index}`} className={active ? "lv-pop" : undefined}
                style={active ? delay(Math.max(0, activeOrder.indexOf(index))) : undefined}>
                <circle cx={point.x} cy={point.y} r={15} strokeWidth={1.5} className={active ? "fill-primary/10 stroke-primary" : "fill-card stroke-border"} />
                <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} className={active ? "fill-primary" : "fill-foreground"}>
                  {labelsAreShort ? label.slice(0, 3) : index + 1}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex max-w-full flex-col items-center gap-1">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2.5 rounded-full border border-border bg-card" />
              unvisited
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2.5 rounded-full border border-primary/60 bg-primary/15" />
              visited
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-0.5 w-4 rounded-full bg-primary" />
              active edge
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{strip}</p>
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
      </div>
    </VisualFrame>
  );
}
