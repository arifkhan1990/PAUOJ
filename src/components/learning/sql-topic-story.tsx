import { Database, Lightbulb, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SQL_PROBLEMS } from "@/server/db/sql-problems";

type Story = {
  problemSlug: string;
  columns: string[];
  tables: string[];
};

/**
 * One real ShopSphere query per topic. The story is rendered from the seeded
 * problem's actual reference SQL and sample rows, so it cannot drift from the
 * fixture or teach a table/column that does not exist.
 */
const STORIES: Record<string, Story> = {
  orientation: {
    problemSlug: "sql-vendor-directory",
    columns: ["name", "city"],
    tables: ["vendors"],
  },
  "money-and-orders": {
    problemSlug: "sql-order-receipts",
    columns: ["order_id", "customer", "total_cents"],
    tables: ["orders", "customers", "order_items"],
  },
  "missing-rows": {
    problemSlug: "sql-unsold-products",
    columns: ["name", "vendor", "stock"],
    tables: ["products", "vendors", "order_items", "orders"],
  },
  subqueries: {
    problemSlug: "sql-above-category-average",
    columns: ["name", "category", "price_cents"],
    tables: ["products", "categories"],
  },
  "set-operations": {
    problemSlug: "sql-marketplace-cities",
    columns: ["city"],
    tables: ["vendors", "customers"],
  },
  "text-and-dates": {
    problemSlug: "sql-product-search",
    columns: ["name", "price_cents"],
    tables: ["products"],
  },
  "order-lifecycle": {
    problemSlug: "sql-orders-without-payment",
    columns: ["order_id", "customer", "status"],
    tables: ["orders", "customers", "payments"],
  },
  "joins-in-depth": {
    problemSlug: "sql-same-category-pairs",
    columns: [
      "category",
      "cheaper_product",
      "expensive_product",
      "price_gap_cents",
    ],
    tables: ["products", "categories"],
  },
  pagination: {
    problemSlug: "sql-top-products-page",
    columns: ["product", "revenue_cents"],
    tables: ["products", "order_items", "orders"],
  },
  "text-dates-time": {
    problemSlug: "sql-order-age",
    columns: ["order_id", "customer", "ordered_at", "age_days"],
    tables: ["orders", "customers"],
  },
  "window-thinking": {
    problemSlug: "sql-adv-top-product",
    columns: ["category", "product", "revenue_cents"],
    tables: ["categories", "products", "order_items", "orders"],
  },
  hierarchies: {
    problemSlug: "sql-adv-category-tree",
    columns: ["id", "path"],
    tables: ["categories"],
  },
  "business-metrics": {
    problemSlug: "sql-adv-category-share",
    columns: ["category", "revenue_cents", "share_pct"],
    tables: ["categories", "products", "order_items", "orders"],
  },
  timelines: {
    problemSlug: "sql-adv-moving-average",
    columns: ["day", "daily_cents", "moving_avg"],
    tables: ["orders", "order_items"],
  },
  "funnels-coupons": {
    problemSlug: "sql-adv-cart-conversion",
    columns: ["month", "carts", "converted", "conversion_pct"],
    tables: ["carts"],
  },
  "json-inventory": {
    problemSlug: "sql-adv-brand-warranty",
    columns: ["brand", "products", "avg_warranty_months"],
    tables: ["product_attributes"],
  },
  "finance-reconciliation": {
    problemSlug: "sql-adv-payout-reconciliation",
    columns: [
      "vendor",
      "payout_gross_cents",
      "expected_gross_cents",
      "payout_net_cents",
      "expected_net_cents",
      "difference_cents",
    ],
    tables: ["vendor_payouts", "orders", "order_items", "products", "returns"],
  },
  "advanced-windows": {
    problemSlug: "sql-adv-customer-lag",
    columns: [
      "customer",
      "order_id",
      "ordered_at",
      "order_cents",
      "previous_ordered_at",
      "days_since_previous",
    ],
    tables: ["orders", "customers", "order_items"],
  },
  "pivot-grouping": {
    problemSlug: "sql-adv-vendor-month-pivot",
    columns: ["vendor", "oct_cents", "nov_cents", "total_cents"],
    tables: ["vendors", "products", "order_items", "orders"],
  },
  "query-performance": {
    problemSlug: "sql-adv-keyset-pagination",
    columns: ["customer", "order_id", "ordered_at", "order_cents"],
    tables: ["orders", "customers", "order_items"],
  },
  "ddl-and-indexes": {
    problemSlug: "sql-lab-create-index",
    columns: ["index_name", "order_id", "ordered_at"],
    tables: ["orders", "sqlite_master"],
  },
  "dml-and-transactions": {
    problemSlug: "sql-lab-transaction",
    columns: ["product", "stock", "vendor", "rating"],
    tables: ["products", "vendors"],
  },
  capstone: {
    problemSlug: "sql-adv-vendor-scorecard",
    columns: [
      "vendor",
      "revenue_cents",
      "order_count",
      "avg_order_cents",
      "revenue_rank",
    ],
    tables: ["vendors", "products", "order_items", "orders"],
  },
};

const FALLBACK: Story = {
  problemSlug: "sql-vendor-directory",
  columns: ["name", "city"],
  tables: ["vendors"],
};

function parseRows(output: string): string[][] {
  if (!output.trim()) return [];
  return output
    .split("\n")
    .map((line) =>
      line.split("\t").map((cell) => (cell === "\\N" ? "NULL" : cell)),
    );
}

export function SqlTopicStory({
  topicSlug,
  className,
}: {
  topicSlug: string;
  className?: string;
}) {
  const story = STORIES[topicSlug] ?? FALLBACK;
  const problem = SQL_PROBLEMS.find(
    (item) => item.slug === story.problemSlug,
  );
  if (!problem) return null;
  const rows = parseRows(problem.tests[0]?.expectedOutput ?? "").slice(0, 6);
  const hiddenRows = Math.max(
    0,
    parseRows(problem.tests[0]?.expectedOutput ?? "").length - rows.length,
  );

  return (
    <figure
      className={cn(
        "not-prose min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex items-start gap-2 border-b border-border bg-muted/25 px-4 py-3">
        <Database
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Real-data story
          </p>
          <h3 lang="bn" className="mt-0.5 text-sm font-semibold leading-snug">
            {problem.title}
          </h3>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:divide-x lg:divide-border">
        <div className="min-w-0 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Table2 className="size-3.5" aria-hidden="true" />
            Tables used
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {story.tables.map((table) => (
              <span
                key={table}
                className="rounded-full border border-border bg-background/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {table}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Query
          </p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-muted/35 p-3 font-mono text-[10.5px] leading-relaxed text-foreground">
            <code>{problem.referenceSql}</code>
          </pre>
        </div>

        <div className="min-w-0 border-t border-border p-4 lg:border-t-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Actual result from the fixture
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  {story.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap py-1.5 pr-3 font-mono text-[10px] font-semibold text-muted-foreground last:pr-0"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${index}-${row.join("|")}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${cellIndex}-${cell}`}
                        className={cn(
                          "whitespace-nowrap py-1.5 pr-3 font-mono text-[10.5px] last:pr-0",
                          cell === "NULL"
                            ? "text-muted-foreground/70"
                            : "text-foreground",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hiddenRows > 0 ? (
            <p className="mt-2 text-[10px] text-muted-foreground">
              + {hiddenRows} more rows in the sample output.
            </p>
          ) : null}
          <p
            lang="bn"
            className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-[11px] leading-relaxed text-muted-foreground"
          >
            <Lightbulb
              className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>
              এই সারিগুলো ShopSphere fixture থেকে আসল query চালিয়ে পাওয়া;
              ডায়াগ্রামে বানানো সংখ্যা নয়।
            </span>
          </p>
        </div>
      </div>
    </figure>
  );
}
