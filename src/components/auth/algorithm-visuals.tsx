import { Fragment, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type FigureProps = {
  className?: string;
  children: React.ReactNode;
};

function AlgoFigure({ className, children }: FigureProps) {
  return (
    <figure className={cn("absolute opacity-80", className)}>
      {children}
    </figure>
  );
}

const sortValues = [38, 12, 74, 26, 91, 53, 8, 60];
const sortedValues = [...sortValues].sort((a, b) => a - b);

export function SortingVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[196px]", className)}>
      <div className="relative h-[72px] w-[192px]">
        {sortValues.map((value, index) => {
          const target = sortedValues.indexOf(value);
          return (
            <div
              key={`${value}-${index}`}
              className="auth-sort-bar absolute bottom-0 w-[18px] rounded-t-[3px] bg-gradient-to-t from-emerald-500/15 to-emerald-500/50 dark:to-emerald-400/50"
              style={
                {
                  left: index * 24,
                  height: 26 + value * 0.45,
                  zIndex: value,
                  animationDelay: `${index * 45}ms`,
                  "--shift": `${(target - index) * 24}px`,
                } as CSSProperties
              }
            >
              <span className="absolute inset-x-0 top-1 text-center font-mono text-[7px] leading-none text-emerald-800/70 dark:text-emerald-100/75">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </AlgoFigure>
  );
}

const binaryValues = [3, 7, 12, 18, 25, 33, 41, 56, 72, 89];

export function BinarySearchVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[218px]", className)}>
      <div className="mb-1 flex justify-end font-mono text-[8px] text-cyan-700/60 dark:text-cyan-300/50">
        find 33
      </div>
      <div className="relative inline-flex gap-[2px]">
        {binaryValues.map((value) => (
          <span
            key={value}
            className={cn(
              "grid h-6 w-5 place-items-center rounded-[3px] border border-border/70 bg-background/20 font-mono text-[7px] text-foreground/45",
              value === 33 &&
                "border-cyan-600/50 bg-cyan-500/10 text-cyan-800 dark:border-cyan-400/60 dark:bg-cyan-400/10 dark:text-cyan-100",
            )}
          >
            {value}
          </span>
        ))}
        <span className="auth-search-range absolute -inset-y-1 rounded-[3px] border-y border-cyan-600/40 bg-cyan-500/[0.06] dark:border-cyan-400/40 dark:bg-cyan-400/[0.06]" />
        <span className="auth-search-mid absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/60 dark:bg-cyan-400/70" />
      </div>
    </AlgoFigure>
  );
}

const windowValues = [4, 2, 7, 1, 9, 3, 8, 5];

export function SlidingWindowVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[190px]", className)}>
      <div className="mb-1 flex justify-between font-mono text-[8px] text-amber-700/60 dark:text-amber-300/50">
        <span>k = 3</span>
        <span>sum</span>
      </div>
      <div className="relative inline-flex gap-[2px]">
        {windowValues.map((value, index) => (
          <span
            key={index}
            className="grid h-6 w-[22px] place-items-center rounded-[3px] border border-border/70 bg-background/20 font-mono text-[7px] text-foreground/45"
          >
            {value}
          </span>
        ))}
        <span className="auth-window absolute -inset-y-1 w-[70px] rounded-[3px] border border-amber-600/50 bg-amber-500/[0.08] dark:border-amber-400/50 dark:bg-amber-400/[0.08]" />
      </div>
    </AlgoFigure>
  );
}

const graphNodes = [
  { x: 20, y: 20, value: 12 },
  { x: 90, y: 16, value: 7 },
  { x: 158, y: 26, value: 19 },
  { x: 38, y: 92, value: 3 },
  { x: 110, y: 88, value: 8 },
  { x: 160, y: 100, value: 21 },
];

const graphEdges: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 4],
  [4, 5],
];

export function GraphVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[210px]", className)}>
      <svg
        viewBox="0 0 180 120"
        className="h-[120px] w-full overflow-visible text-foreground/15"
        role="presentation"
      >
        {graphEdges.map(([from, to], index) => (
          <line
            key={index}
            x1={graphNodes[from]?.x}
            y1={graphNodes[from]?.y}
            x2={graphNodes[to]?.x}
            y2={graphNodes[to]?.y}
            stroke="currentColor"
            strokeWidth="0.8"
          />
        ))}
        {graphNodes.map((node, index) => (
          <g
            key={`${node.x}-${node.y}`}
            className="auth-graph-node text-violet-600/70 dark:text-violet-300/80"
            style={{ animationDelay: `${index * 0.45}s` }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <text
              x={node.x}
              y={node.y + 2.5}
              textAnchor="middle"
              fontSize="7"
              fill="currentColor"
              className="font-mono"
            >
              {node.value}
            </text>
          </g>
        ))}
      </svg>
    </AlgoFigure>
  );
}

const listValues = [12, 7, 19, 3];

export function LinkedListVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[200px]", className)}>
      <div className="mb-1 flex justify-between font-mono text-[8px] text-sky-700/60 dark:text-sky-300/50">
        <span>head</span>
        <span>null</span>
      </div>
      <div className="flex items-center gap-1">
        {listValues.map((value, index) => (
          <Fragment key={index}>
            <span className="relative grid h-7 w-9 place-items-center rounded-md border border-sky-600/25 bg-sky-500/[0.06] font-mono text-[8px] text-sky-900/80 dark:border-sky-400/20 dark:bg-sky-400/[0.04] dark:text-sky-100/80">
              {value}
              <span
                className="auth-list-node absolute inset-0 rounded-md border border-sky-500/50 dark:border-sky-300/60"
                style={{ animationDelay: `${index * 1.1}s` }}
              />
            </span>
            {index < listValues.length - 1 ? (
              <span className="text-[9px] text-muted-foreground/50">→</span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </AlgoFigure>
  );
}

const stackValues = [23, 8, 17, 42];

export function StackVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[150px]", className)}>
      <div className="mb-1 flex h-4 justify-center">
        <span className="auth-stack-push rounded border border-rose-600/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[7px] text-rose-800/70 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200/70">
          56
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {stackValues.map((value, index) => (
          <div
            key={value}
            className={cn(
              "flex h-5 items-center justify-between rounded border px-2 font-mono text-[8px]",
              index === 0
                ? "border-rose-600/40 bg-rose-500/[0.08] text-rose-800 dark:border-rose-400/40 dark:bg-rose-400/[0.08] dark:text-rose-100/80"
                : "border-border/70 bg-background/20 text-muted-foreground",
            )}
          >
            <span>{value}</span>
            {index === 0 ? (
              <span className="text-[6px] uppercase tracking-wider text-rose-700/60 dark:text-rose-300/60">
                top
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </AlgoFigure>
  );
}

const queueValues = [5, 9, 2, 7];

export function QueueVisual({ className }: Pick<FigureProps, "className">) {
  return (
    <AlgoFigure className={cn("w-[190px]", className)}>
      <div className="mb-1 flex justify-between font-mono text-[8px] text-emerald-700/60 dark:text-emerald-300/50">
        <span>front</span>
        <span>back</span>
      </div>
      <div className="relative flex items-center gap-1">
        {queueValues.map((value, index) => (
          <span
            key={index}
            className={cn(
              "grid h-7 w-9 place-items-center rounded-md border font-mono text-[8px]",
              index === 0
                ? "border-emerald-600/40 bg-emerald-500/[0.08] text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/[0.08] dark:text-emerald-100/80"
                : "border-border/70 bg-background/20 text-muted-foreground",
            )}
          >
            {value}
          </span>
        ))}
        <span className="auth-queue-item absolute -right-1 top-0 grid h-7 w-7 place-items-center rounded-md border border-emerald-600/30 bg-emerald-500/10 font-mono text-[7px] text-emerald-800/70 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200/70">
          11
        </span>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[7px] text-muted-foreground/50">
        <span>← dequeue</span>
        <span>enqueue →</span>
      </div>
    </AlgoFigure>
  );
}
