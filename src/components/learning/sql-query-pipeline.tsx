import { Gauge, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Logical execution order of a SQL query. The numbered list always carries
 * the full text, so the CSS sweep is decoration only: `sql-pipeline-step`
 * pulses one panel at a time when motion is allowed and stays static when
 * `prefers-reduced-motion` is set.
 */
const PIPELINE_STEPS = [
  { keyword: "FROM / JOIN", detail: "টেবিল জোড়া লাগাও" },
  { keyword: "WHERE", detail: "সারি বাদ দাও" },
  { keyword: "GROUP BY", detail: "দল বানাও" },
  { keyword: "HAVING", detail: "দল ফিল্টার করো" },
  { keyword: "WINDOW", detail: "দলের ভিতরে হিসাব" },
  { keyword: "SELECT", detail: "কলাম ও alias বাছো" },
  { keyword: "ORDER BY", detail: "ফল সাজাও" },
  { keyword: "LIMIT", detail: "শুধু দরকারি সারি" },
] as const;

export function SqlQueryPipeline({ className }: { className?: string }) {
  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-muted/20 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="size-4 text-primary" aria-hidden="true" />
          Query execution pipeline
        </h3>
        <p lang="bn" className="text-[11px] text-muted-foreground">
          লেখার ক্রম নয়—ডেটাবেস যেভাবে চালায়
        </p>
      </div>

      <ol
        aria-label="SQL query execution order"
        className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-8"
      >
        {PIPELINE_STEPS.map((step, index) => (
          <li
            key={step.keyword}
            className="sql-pipeline-step min-w-0 rounded-lg border p-2.5"
            style={{ animationDelay: `${index}s` }}
          >
            <span className="font-mono text-[10px] font-semibold tabular-nums text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-0.5 break-words font-mono text-[11px] font-semibold leading-tight text-foreground">
              {step.keyword}
            </p>
            <p lang="bn" className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>

      <p
        lang="bn"
        className="flex items-start gap-1.5 border-t border-border px-4 py-2 text-[11px] leading-relaxed text-muted-foreground"
      >
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        WINDOW আসলে SELECT-এর সাথে চলে; ক্রমটা বোঝার সুবিধার জন্য এখানে
        আলাদা দেখানো হয়েছে।
      </p>
    </Card>
  );
}
