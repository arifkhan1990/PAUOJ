import Link from "next/link";
import { ChevronRight, KeyRound, Link2 } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  getSqlProjectEpic,
  type SqlProjectTable,
} from "@/lib/learning/sql-project";
import { SQL_PROJECT_TABLES } from "@/lib/learning/sql-project-schema";
import { cn } from "@/lib/utils";
import { ProjectEmpty } from "./project-shared";

function TableExplorer({ table }: { table: SqlProjectTable }) {
  const epics = table.usedByEpicSlugs
    .map((slug) => getSqlProjectEpic(slug))
    .filter((epic) => epic !== null);

  return (
    <details className="group min-w-0 rounded-lg border border-border bg-card shadow-xs">
      <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="break-all font-mono text-xs font-semibold">
              {table.name}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {table.rowCount.toLocaleString("en-US")} rows
            </span>
          </span>
          <span
            lang="bn"
            className="mt-1 block break-words text-[11px] leading-relaxed text-muted-foreground"
          >
            {table.purpose}
          </span>
        </span>
        <ChevronRight
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
          aria-hidden="true"
        />
      </summary>

      <div className="min-w-0 border-t border-border">
        <dl className="grid gap-2 px-4 py-3 text-[11px] sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <KeyRound className="size-3" aria-hidden="true" />
              Primary key
            </dt>
            <dd className="mt-0.5 break-all font-mono">{table.primaryKey}</dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Link2 className="size-3" aria-hidden="true" />
              Foreign keys
            </dt>
            <dd className="mt-0.5 break-all font-mono">
              {table.foreignKeys.length > 0
                ? table.foreignKeys.join(", ")
                : "—"}
            </dd>
          </div>
        </dl>

        {table.columns.length > 0 ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[420px] border-collapse text-left text-[11px]">
              <caption className="sr-only">
                {table.name} columns: name, type and note.
              </caption>
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Column
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((column) => (
                  <tr
                    key={column.name}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-1.5 font-mono">
                      {column.name}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-muted-foreground">
                      {column.type}
                    </td>
                    <td
                      lang="bn"
                      className="min-w-[12rem] break-words px-4 py-1.5 text-muted-foreground"
                    >
                      {column.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {epics.length > 0 ? (
          <div className="border-t border-border px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Used by
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {epics.map((epic) => (
                <li key={epic.slug}>
                  <Link
                    href={`/learn/sql/project#epic-${epic.slug}`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground underline-offset-4 transition-colors hover:border-primary/40 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-8"
                  >
                    {epic.ticketPrefix} · {epic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

const GROUP_ORDER = [
  "Catalog",
  "Orders & payments",
  "Fulfillment",
  "Cart & checkout",
  "Inventory",
  "Vendors & finance",
  "Customers & growth",
];

export function ProjectSchema({ className }: { className?: string }) {
  const groupRank = new Map(GROUP_ORDER.map((group, index) => [group, index]));
  const groups = new Map<string, SqlProjectTable[]>();
  const orderedTables = [...SQL_PROJECT_TABLES].sort(
    (a, b) =>
      (groupRank.get(a.group) ?? GROUP_ORDER.length) -
      (groupRank.get(b.group) ?? GROUP_ORDER.length),
  );
  for (const table of orderedTables) {
    const list = groups.get(table.group) ?? [];
    list.push(table);
    groups.set(table.group, list);
  }

  return (
    <section id="schema" className={cn("scroll-mt-24", className)}>
      <SectionHeading
        title="Schema explorer"
        description="Every table in the ShopSphere fixture, grouped by business area. Open a table for keys, columns and the epics that use it."
      />

      {SQL_PROJECT_TABLES.length === 0 ? (
        <ProjectEmpty>
          The table explorer is generated from the judge fixture and fills in
          with the project data.
        </ProjectEmpty>
      ) : (
        <div className="mt-4 space-y-7">
          {[...groups.entries()].map(([group, tables]) => (
            <div key={group} className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                <h3 className="text-sm font-semibold">{group}</h3>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {tables.length} {tables.length === 1 ? "table" : "tables"}
                </span>
              </div>
              <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
                {tables.map((table) => (
                  <TableExplorer key={table.name} table={table} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
