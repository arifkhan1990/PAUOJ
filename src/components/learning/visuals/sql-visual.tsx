// Renders the `sql` lesson visual: two mini tables flowing through an operator
// chip into a result table.

import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };
type TableSpec = { title: string; columns: [string, string] };
type VariantSpec = {
  op: string;
  left: TableSpec;
  right: TableSpec;
  resultTitle: string;
  resultColumns: [string, string];
  note: string;
};
type Rows = Array<[string, string]>;

const ROWS: Rows = [["1", "330"], ["2", "120"], ["3", "80"]];
const NAMES: Rows = [["1", "Ayesha"], ["2", "Rafiq"], ["3", "Nabila"]];
const RESULT: Rows = [["Ayesha", "330"], ["Rafiq", "120"], ["Nabila", "80"]];
const EMAIL_ROWS: Rows = [["aya@uni.edu", "2024"], ["rafiq@uni.edu", "2023"], ["nabila@uni.edu", "2025"]];
const PLAN_ROWS: Rows = [["Seq Scan", "1200"], ["Hash Join", "340"], ["Sort", "80"]];
const JSON_ROWS: Rows = [["name", "Ayesha"], ["batch", "2024"], ["active", "true"]];
const TEXT_ROWS: Rows = [["১", "JOIN বোঝা"], ["২", "INDEX টিউনিং"], ["৩", "Postgres টিপস"]];

const VARIANTS: Record<string, VariantSpec> = {
  select: {
    op: "SELECT", left: { title: "users", columns: ["id", "name"] }, right: { title: "pick", columns: ["column", "alias"] },
    resultTitle: "projected", resultColumns: ["vendor", "rating"], note: "শুধু দরকারি column আর alias বেছে নাও",
  },
  ddl: {
    op: "CREATE INDEX / VIEW", left: { title: "orders", columns: ["customer_id", "ordered_at"] }, right: { title: "sqlite_master", columns: ["name", "type"] },
    resultTitle: "catalog", resultColumns: ["name", "type"], note: "index/view তৈরি করে sqlite_master-এ type ধরে যাচাই করো",
  },
  dml: {
    op: "BEGIN / UPDATE / ROLLBACK", left: { title: "products", columns: ["id", "stock"] }, right: { title: "inventory_movements", columns: ["product_id", "qty"] },
    resultTitle: "after transaction", resultColumns: ["product", "stock"], note: "WHERE-সহ বদল, তারপর SELECT দিয়ে আগের/নতুন মান যাচাই",
  },
  join: {
    op: "JOIN ON", left: { title: "orders", columns: ["user_id", "total"] }, right: { title: "users", columns: ["id", "name"] },
    resultTitle: "joined rows", resultColumns: ["vendor", "total"], note: "মিলে যাওয়া key ধরে দুই table-এর row জোড়া লাগে",
  },
  outer: {
    op: "LEFT JOIN", left: { title: "orders", columns: ["user_id", "total"] }, right: { title: "users", columns: ["id", "name"] },
    resultTitle: "kept rows", resultColumns: ["item", "stock"], note: "match না থাকলেও বাম দিকের row থাকে, ডান দিকে NULL",
  },
  group: {
    op: "GROUP BY", left: { title: "orders", columns: ["user_id", "total"] }, right: { title: "groups", columns: ["key", "rows"] },
    resultTitle: "aggregated", resultColumns: ["group", "total"], note: "একই group-এর row-গুলো এক row-তে জমা হয়",
  },
  subquery: {
    op: "IN (SELECT …)", left: { title: "orders", columns: ["user_id", "total"] }, right: { title: "subquery", columns: ["id", "total"] },
    resultTitle: "filtered", resultColumns: ["category", "count"], note: "ভেতরের query আগে চলে, বাইরের query তার ফল ব্যবহার করে",
  },
  set: {
    op: "UNION", left: { title: "students", columns: ["email", "batch"] }, right: { title: "alumni", columns: ["email", "batch"] },
    resultTitle: "combined", resultColumns: ["city", "count"], note: "দুই result set একসাথে; ডুপ্লিকেট বাদ যায়",
  },
  window: {
    op: "OVER (PARTITION BY)", left: { title: "orders", columns: ["user_id", "total"] }, right: { title: "window", columns: ["partition", "rank"] },
    resultTitle: "windowed", resultColumns: ["group", "rank"], note: "row মুছে না গিয়ে প্রতি partition-এ rank বসে",
  },
  recursive: {
    op: "WITH RECURSIVE", left: { title: "employees", columns: ["id", "manager_id"] }, right: { title: "anchor", columns: ["id", "depth"] },
    resultTitle: "walked tree", resultColumns: ["node", "depth"], note: "anchor row দিয়ে শুরু, প্রতিবার recursive part চলে",
  },
  lifecycle: {
    op: "WHERE → GROUP", left: { title: "orders", columns: ["status", "total"] }, right: { title: "checks", columns: ["stage", "rule"] },
    resultTitle: "shaped rows", resultColumns: ["stage", "count"], note: "row কোন ধাপে filter বা dedupe হয় মনে রাখো",
  },
  text: {
    op: "ILIKE / FTS", left: { title: "posts", columns: ["id", "title"] }, right: { title: "search", columns: ["term", "match"] },
    resultTitle: "hits", resultColumns: ["term", "matches"], note: "text search-এ index ব্যবহার করলে drag অনেক কমে",
  },
  pagination: {
    op: "ORDER BY + LIMIT", left: { title: "rows", columns: ["id", "rank"] }, right: { title: "page", columns: ["limit", "offset"] },
    resultTitle: "page 2", resultColumns: ["row", "value"], note: "stable ORDER BY ছাড়া page বদলে যেতে পারে",
  },
  funnel: {
    op: "COUNT BY STEP", left: { title: "events", columns: ["step", "users"] }, right: { title: "stages", columns: ["from", "to"] },
    resultTitle: "funnel", resultColumns: ["step", "kept"], note: "প্রতি ধাপে কত user টিকে থাকে",
  },
  reconcile: {
    op: "FULL OUTER JOIN", left: { title: "ledger", columns: ["id", "amount"] }, right: { title: "bank", columns: ["id", "amount"] },
    resultTitle: "diff", resultColumns: ["item", "amount"], note: "দুই source-এর mismatch বা missing row ধরো",
  },
  pivot: {
    op: "CASE + GROUP BY", left: { title: "sales", columns: ["region", "amount"] }, right: { title: "pivot", columns: ["region", "quarter"] },
    resultTitle: "pivoted", resultColumns: ["period", "total"], note: "row-ভিত্তিক ডেটাকে column-এ ঘুরিয়ে দেখাও",
  },
  json: {
    op: "jsonb_each", left: { title: "documents", columns: ["id", "payload"] }, right: { title: "keys", columns: ["key", "value"] },
    resultTitle: "expanded rows", resultColumns: ["entry", "value"], note: "JSON object-এর প্রতিটি key আলাদা row হয়ে যায়",
  },
  plan: {
    op: "EXPLAIN", left: { title: "plan", columns: ["node", "rows"] }, right: { title: "stats", columns: ["table", "cost"] },
    resultTitle: "execution order", resultColumns: ["step", "cost"], note: "উপরের থেকে নিচে plan node-গুলো কোন ক্রমে চলবে",
  },
  capstone: {
    op: "WITH … SELECT", left: { title: "cte_users", columns: ["id", "name"] }, right: { title: "cte_orders", columns: ["user_id", "total"] },
    resultTitle: "report", resultColumns: ["period", "total"], note: "CTE → filter → aggregate → final report",
  },
};

const VARIANT_ROWS: Record<string, Rows> = {
  set: EMAIL_ROWS,
  plan: PLAN_ROWS,
  json: JSON_ROWS,
  text: TEXT_ROWS,
};

function MiniTable({ spec, rows, tone, compact }: { spec: TableSpec; rows: Rows; tone: "primary" | "accent"; compact: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-card/80 p-2">
      <p className={cn("truncate font-mono text-[10px] font-semibold", tone === "primary" ? "text-foreground" : "text-foreground")}>
        {spec.title}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-1">
        {spec.columns.map((column) => (
          <span key={column} className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {column}
          </span>
        ))}
        {rows.map((row, rowIndex) => (
          <div key={`${row[0]}-${rowIndex}`} className="contents">
            {row.map((cell, cellIndex) => (
              <span
                key={`${cellIndex}-${cell}`}
                className={cn(
                  "truncate rounded-sm bg-muted/50 px-1 py-0.5 font-mono tabular-nums text-foreground",
                  compact ? "text-[10px]" : "text-[10px]",
                )}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SqlVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "join";
  const spec: VariantSpec = VARIANTS[variant] ?? VARIANTS.join;
  const labels = config.data?.labels ?? [];
  const values = config.data?.values ?? [];
  const customResult: Rows =
    labels.length >= 2 && values.length >= 2
      ? labels.slice(0, 4).map((label, index) => [label, String(values[index] ?? "")])
      : [];
  const rowsForVariant = VARIANT_ROWS[variant];
  const rowsFor = (table: TableSpec) =>
    rowsForVariant ?? (table.columns[1] === "name" ? NAMES : ROWS);
  const resultRows = customResult.length > 0
    ? customResult
    : rowsForVariant ?? (spec.resultColumns[0] === "name" ? RESULT : ROWS);
  const rowDelay = (row: number, column: number): CSSProperties => ({
    animationDelay: `${180 + row * 220 + column * 50}ms`,
  });

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <MiniTable spec={spec.left} rows={rowsFor(spec.left)} tone="primary" compact={compact} />

          <div className="flex shrink-0 flex-row items-center justify-center gap-1 sm:w-16 sm:flex-col">
            <span className="lv-glow inline-flex items-center justify-center max-w-full rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-center font-mono text-[10px] font-semibold text-foreground">
              {spec.op}
            </span>
            <ArrowRight
              className="size-3.5 rotate-90 text-muted-foreground lv-sweep sm:rotate-0"
              style={{ "--lv-travel": "10px" } as CSSProperties}
              aria-hidden="true"
            />
          </div>

          <MiniTable spec={spec.right} rows={rowsFor(spec.right)} tone="accent" compact={compact} />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-2">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{spec.resultTitle}</p>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {spec.resultColumns.map((column) => (
              <span key={column} className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {column}
              </span>
            ))}
            {resultRows.flatMap((row, rowIndex) =>
              row.map((cell, cellIndex) => (
                <span
                  key={`${rowIndex}-${cellIndex}`}
                  className={cn(
                    "lv-rise truncate rounded-sm border px-1 py-0.5 font-mono text-[10px]",
                    cellIndex === 0
                      ? "border-primary/20 bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                  style={rowDelay(rowIndex, cellIndex)}
                >
                  {cell}
                </span>
              )),
            )}
          </div>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">{spec.note}</p>
      </div>
    </VisualFrame>
  );
}
