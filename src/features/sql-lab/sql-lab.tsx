"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  LockKeyhole,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { PROJECT_SQL } from "@/lib/sql-lab/project";
import { SqlLabSidebar } from "@/features/sql-lab/sql-lab-sidebar";
import {
  SQL_LAB_TASKS,
  isTaskUnlocked,
  rowsMatch,
  type SqlLabCell,
  type SqlLabTask,
} from "@/lib/sql-lab/tasks";

type QueryResult = { columns: string[]; values: SqlLabCell[][] };
type SqlDatabase = {
  run: (sql: string) => void;
  exec: (sql: string) => QueryResult[];
  close: () => void;
};
type SqlJsStatic = { Database: new () => SqlDatabase };

let sqlPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = import("sql.js").then((module) =>
      (module.default as unknown as (config: {
        locateFile: () => string;
      }) => Promise<SqlJsStatic>)({
        locateFile: () => "/sqljs/sql-wasm.wasm",
      }),
    );
  }
  return sqlPromise;
}

async function runQuery(query: string): Promise<QueryResult> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  try {
    db.run(PROJECT_SQL);
    const results = db.exec(query).filter((result) => result.columns.length > 0);
    return results.at(-1) ?? { columns: [], values: [] };
  } finally {
    db.close();
  }
}

export function SqlLab({
  completed: initialCompleted,
  advancedUnlocked,
  signedIn,
}: {
  completed: string[];
  advancedUnlocked: boolean;
  signedIn: boolean;
}) {
  const [selectedId, setSelectedId] = useState(SQL_LAB_TASKS[0].id);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [completed, setCompleted] = useState(new Set(initialCompleted));
  const [message, setMessage] = useState<string | null>(null);

  const task = SQL_LAB_TASKS.find((item) => item.id === selectedId)!;
  const locked = !isTaskUnlocked(task, advancedUnlocked);
  const correct =
    result !== null && rowsMatch(result.values, task.expected);

  const selectTask = (next: SqlLabTask) => {
    if (!isTaskUnlocked(next, advancedUnlocked)) return;
    setSelectedId(next.id);
    setQuery("");
    setResult(null);
    setError(null);
    setMessage(null);
    setHintOpen(false);
  };

  const run = async () => {
    if (running || !query.trim()) return;
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      const next = await runQuery(query);
      setResult(next);
      if (rowsMatch(next.values, task.expected)) {
        if (!signedIn) {
          setMessage("Correct. Sign in to save your progress.");
        } else if (!completed.has(task.id)) {
          try {
            const response = await apiPost<{ completed: string[] }>(
              "/api/v1/learning/sql-lab/progress",
              { taskId: task.id },
            );
            setCompleted(new Set(response.completed));
            setMessage("Task complete — progress saved.");
          } catch {
            setMessage(
              "Correct! The result matches, but progress could not be saved. Try again.",
            );
          }
        } else {
          setMessage("Correct. This task is already complete.");
        }
      }
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : requestError instanceof Error
            ? requestError.message
            : "Could not run the query.",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <SqlLabSidebar
        activeId={task.id}
        completed={completed}
        advancedUnlocked={advancedUnlocked}
        onSelect={selectTask}
      />

      <div className="min-w-0 space-y-4">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={task.level === "basic" ? "secondary" : "warning"}>
                  {task.level === "basic" ? "Basic" : "Advanced"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {task.feature}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{task.title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {task.prompt}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setHintOpen((open) => !open)}
            >
              <Lightbulb className="size-3.5" />
              {hintOpen ? "Hide hint" : "Hint"}
            </Button>
          </div>
          {hintOpen ? (
            <p className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {task.hint}
            </p>
          ) : null}
        </Card>

        {locked ? (
          <Card className="flex flex-col items-center p-6 text-center">
            <LockKeyhole className="size-6 text-amber-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">Advanced task locked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Buy Advanced SQL (৳500) to open this task and the project
              dashboard tracks.
            </p>
            <Link href="/learn/pricing" className={buttonVariants()}>
              Open pricing
            </Link>
          </Card>
        ) : (
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <p className="text-xs font-medium">Query editor</p>
              <p className="text-[10px] text-muted-foreground">
                Runs on a fresh copy of the marketplace · Ctrl/⌘ + Enter
              </p>
            </div>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void run();
                }
              }}
              spellCheck={false}
              placeholder={`-- ${task.title}\nSELECT ...`}
              className="min-h-40 w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
              aria-label="SQL query"
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
              <Button type="button" size="sm" onClick={() => void run()} disabled={running || !query.trim()}>
                {running ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5" />
                )}
                Run query
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setResult(null);
                  setError(null);
                  setMessage(null);
                }}
              >
                <RotateCcw className="size-3.5" /> Reset
              </Button>
              {correct ? (
                <Badge variant="success" className="ml-auto">
                  <CheckCircle2 className="size-3" /> Matches expected
                </Badge>
              ) : null}
            </div>

            {error ? (
              <p className="flex gap-2 border-t border-border px-4 py-3 text-xs text-destructive" role="alert">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="border-t border-border px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300" role="status">
                {message}
              </p>
            ) : null}

            {result ? (
              <div className="border-t border-border">
                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <p className="text-xs font-medium">Result</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {result.values.length} rows
                  </p>
                </div>
                <div className="max-h-80 overflow-auto border-t border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/60">
                      <tr>
                        {result.columns.map((column) => (
                          <th key={column} className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.values.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-muted-foreground" colSpan={Math.max(1, result.columns.length)}>
                            No rows returned.
                          </td>
                        </tr>
                      ) : (
                        result.values.map((row, index) => (
                          <tr key={index}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 font-mono tabular-nums">
                                {cell === null ? "NULL" : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
               {correct ? null : (
                  <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                    The row values or ordering differ from the dashboard query.
                    Compare columns and the ORDER BY clause.
                  </p>
                )}
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
