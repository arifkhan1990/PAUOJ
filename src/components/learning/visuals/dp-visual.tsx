// Renders the `dp` lesson visual: a small DP table that fills row by row with
// one dependency cell and the current cell highlighted.

import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

type Grid = {
  columns: string[];
  rows: Array<{ label: string; cells: Array<string | number> }>;
  current: [number, number];
  dependency: [number, number];
  formula: string;
};

function knapsackGrid(): Grid {
  const items = [
    { weight: 2, value: 3 },
    { weight: 3, value: 4 },
    { weight: 4, value: 5 },
  ];
  const capacity = 5;
  const table = Array.from({ length: items.length + 1 }, () =>
    Array.from({ length: capacity + 1 }, () => 0),
  );
  items.forEach((item, row) => {
    const previous = table[row] ?? [];
    const next = table[row + 1] ?? [];
    for (let cap = 0; cap <= capacity; cap += 1) {
      const skip = previous[cap] ?? 0;
      const take = cap >= item.weight ? (previous[cap - item.weight] ?? 0) + item.value : 0;
      next[cap] = Math.max(skip, take);
    }
  });
  return {
    columns: Array.from({ length: capacity + 1 }, (_, index) => String(index)),
    rows: table.map((cells, index) => ({ label: index === 0 ? "∅" : `i${index}`, cells })),
    current: [3, 5],
    dependency: [2, 5],
    formula: "dp[i][c] = max(dp[i-1][c], dp[i-1][c-w] + v)",
  };
}

function lcsGrid(): Grid {
  const a = "ABCB";
  const b = "BDCB";
  const table = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const row = table[i] ?? [];
      row[j] =
        a[i - 1] === b[j - 1]
          ? (table[i - 1]?.[j - 1] ?? 0) + 1
          : Math.max(table[i - 1]?.[j] ?? 0, table[i]?.[j - 1] ?? 0);
    }
  }
  return {
    columns: ["∅", ...b.split("")],
    rows: table.map((cells, index) => ({
      label: index === 0 ? "∅" : (a[index - 1] ?? ""),
      cells,
    })),
    current: [4, 4],
    dependency: [3, 3],
    formula: "match → diag + 1, else max(up, left)",
  };
}

function lisGrid(values: number[]): Grid {
  const dp: number[] = [];
  values.forEach((value, index) => {
    let best = 1;
    for (let previous = 0; previous < index; previous += 1) {
      if ((values[previous] ?? 0) < value) {
        best = Math.max(best, (dp[previous] ?? 1) + 1);
      }
    }
    dp.push(best);
  });
  return {
    columns: values.map((_, index) => String(index)),
    rows: [
      { label: "arr", cells: values },
      { label: "dp", cells: dp },
    ],
    current: [1, values.length - 1],
    dependency: [1, Math.max(0, values.length - 2)],
    formula: "dp[i] = 1 + max(dp[j]) যেখানে j < i, a[j] < a[i]",
  };
}

function uniquePathsGrid(): Grid {
  const size = 4;
  const table = Array.from({ length: size }, () => Array.from({ length: size }, () => 1));
  for (let row = 1; row < size; row += 1) {
    for (let column = 1; column < size; column += 1) {
      const cells = table[row] ?? [];
      cells[column] = (table[row - 1]?.[column] ?? 0) + (cells[column - 1] ?? 0);
    }
  }
  return {
    columns: ["0", "1", "2", "3"],
    rows: table.map((cells, index) => ({ label: `r${index}`, cells })),
    current: [3, 3],
    dependency: [2, 3],
    formula: "dp[i][j] = dp[i-1][j] + dp[i][j-1]",
  };
}

function bitmaskGrid(): Grid {
  const masks = [0, 1, 2, 3];
  return {
    columns: ["A", "B", "C"],
    rows: masks.map((mask) => ({
      label: mask.toString(2).padStart(4, "0"),
      cells: [0, 1, 2].map((bit) => ((mask >> bit) & 1 ? "✓" : "·")),
    })),
    current: [3, 1],
    dependency: [2, 1],
    formula: "if (mask & (1 << i)) → i শহর ভিজিট করা আছে",
  };
}

const FORMULAS: Record<string, string> = {
  knapsack: "dp[i][c] = max(dp[i-1][c], dp[i-1][c-w] + v)",
  lcs: "match → diag + 1, else max(up, left)",
  lis: "dp[i] = 1 + max(dp[j]) যেখানে j < i, a[j] < a[i]",
  grid: "dp[i][j] = dp[i-1][j] + dp[i][j-1]",
  bitmask: "if (mask & (1 << i)) → i নোড/অপশন নেওয়া আছে",
};

function customGrid(values: number[], labels: string[] | undefined, variant: string): Grid {
  const headings = (labels ?? []).filter((label) => label.trim().length > 0);
  const singleRow =
    (variant === "lis" || variant === "knapsack" || variant === "bitmask" || variant === "custom") &&
    headings.length === values.length;
  const columnCount = singleRow ? values.length : Math.max(2, Math.ceil(Math.sqrt(values.length)));
  const columns = singleRow
    ? headings.slice(0, values.length)
    : Array.from({ length: columnCount }, (_, index) => String(index + 1));
  const rows = Array.from({ length: Math.ceil(values.length / columnCount) }, (_, row) => ({
    label: singleRow ? "dp" : `r${row + 1}`,
    cells: values.slice(row * columnCount, (row + 1) * columnCount),
  }));
  const rowIndex = Math.max(0, rows.length - 1);
  const columnIndex = Math.max(0, (rows[rowIndex]?.cells.length ?? 1) - 1);
  return {
    columns,
    rows,
    current: [rowIndex, columnIndex],
    dependency: rowIndex > 0 ? [rowIndex - 1, columnIndex] : [rowIndex, Math.max(0, columnIndex - 1)],
    formula: FORMULAS[variant] ?? "dp[i][j] = আগের cell-গুলোর উপর নির্ভরশীল",
  };
}

function buildGrid(variant: string, values: number[] | undefined, labels: string[] | undefined): Grid {
  if (values && values.length >= 4) return customGrid(values, labels, variant);
  if (variant === "lcs") return lcsGrid();
  if (variant === "lis") return lisGrid([3, 1, 4, 1, 5, 9, 2]);
  if (variant === "grid") return uniquePathsGrid();
  if (variant === "bitmask") return bitmaskGrid();
  return knapsackGrid();
}

export function DpVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? (config.data?.values?.length ? "custom" : "knapsack");
  const grid = buildGrid(variant, config.data?.values, config.data?.labels);
  const size = compact ? "h-6 min-w-6 px-1 text-[10px]" : "h-7 min-w-7 px-1.5 text-[11px]";

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="lv-scroll overflow-x-auto pb-0.5">
          <div
            className="mx-auto grid w-max gap-1"
            style={{ gridTemplateColumns: `auto repeat(${grid.columns.length}, minmax(0, auto))` }}
          >
            <span aria-hidden="true" />
            {grid.columns.map((column, index) => (
              <span
                key={`${column}-${index}`}
                className="pb-0.5 text-center font-mono text-[10px] text-muted-foreground"
              >
                {column}
              </span>
            ))}

            {grid.rows.map((row, rowIndex) => (
              <div key={`${row.label}-${rowIndex}`} className="contents">
                <span className="pr-1 text-right font-mono text-[10px] leading-7 text-muted-foreground">
                  {row.label}
                </span>
                {row.cells.map((cell, columnIndex) => {
                  const isCurrent =
                    rowIndex === grid.current[0] && columnIndex === grid.current[1];
                  const isDependency =
                    rowIndex === grid.dependency[0] && columnIndex === grid.dependency[1];
                  const style: CSSProperties = {
                    animationDelay: `${Math.min(900, (rowIndex * grid.columns.length + columnIndex) * 70)}ms`,
                  };
                  return (
                    <span
                      key={`${rowIndex}-${columnIndex}`}
                      className={cn(
                        "flex items-center justify-center rounded border font-mono tabular-nums transition-colors",
                        size,
                        isCurrent
                          ? "border-primary bg-primary/10 font-semibold text-foreground lv-glow"
                          : isDependency
                            ? "border-accent/50 bg-accent/10 font-semibold text-foreground lv-glow"
                            : "border-border bg-card text-foreground lv-rise",
                      )}
                      style={isCurrent || isDependency ? undefined : style}
                    >
                      {cell}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto max-w-[92%] text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
          {grid.formula}
        </p>
        <p className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm border border-primary bg-primary/20" />current</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm border border-accent/60 bg-accent/20" />dependency</span>
        </p>
      </div>
    </VisualFrame>
  );
}
