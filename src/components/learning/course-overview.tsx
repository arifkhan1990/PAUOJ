import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Database,
  Dumbbell,
  Flag,
  Layers3,
  ListChecks,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LearningModuleView, LearningTopicView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { SqlQueryPipeline } from "./sql-query-pipeline";
import {
  SQL_DATASET_GROUPS,
  SQL_EXAMPLE_ORDERS,
  SQL_OUTCOMES,
} from "./sql-course-overview-data";

type Outcome = { title: string; detail?: string };

function pickOutcomeTopics(
  topics: LearningTopicView[],
  sql: boolean,
): LearningTopicView[] {
  if (topics.length === 0) return [];
  if (!sql) return topics.slice(0, 4);
  // SQL tracks run long: show the first and last topic, then the six SQL
  // capabilities below instead of listing a dozen near-identical summaries.
  return topics.length === 1 ? topics : [topics[0], topics[topics.length - 1]];
}

function prerequisitesFor(module: LearningModuleView, sql: boolean): string[] {
  if (sql) {
    return [
      "একটি কম্পিউটার—মোবাইল ব্রাউজারেও চলবে",
      "আগে SQL জানার দরকার নেই; শূন্য থেকে শুরু",
      "টেবিল/কলামের ইংরেজি নাম আর সাধারণ গণিত",
      "প্রতিদিন ৩০–৪৫ মিনিট অনুশীলনের সময়",
    ];
  }
  if (module.track === "tools") {
    return [
      "কম্পিউটার ও টার্মিনাল ব্যবহারের সাধারণ অভ্যাস",
      "প্রতিদিন ৩০–৪৫ মিনিট অনুশীলনের সময়",
      "আগের ট্র্যাক না থাকলেও চলবে",
    ];
  }
  return [
    module.order === 1
      ? "কোনো পূর্বশর্ত নেই—শূন্য থেকে শুরু"
      : "আগের ট্র্যাকের মূল ধারণা (রিভিশন নোট আছে)",
    "প্রতিদিন ৩০–৪৫ মিনিট অনুশীলনের সময়",
  ];
}

function brief(module: LearningModuleView): string {
  const text = (module.description || module.goal).trim();
  // The header already prints the full brief; keep the overview to one line.
  return text.split(/(?<=[।.!?])\s/)[0] ?? text;
}

function learningSteps(module: LearningModuleView, sql: boolean) {
  const checkpoint = module.checkpoint;
  return [
    {
      icon: BookOpen,
      title: sql ? "কনসেপ্ট, প্রশ্ন দিয়ে" : "ধারণা",
      detail: sql
        ? "প্রথমে বাস্তব প্রশ্ন, তারপর সেই প্রশ্নের query ব্যাখ্যা।"
        : "কেন দরকার আর কীভাবে কাজ করে—উদাহরণসহ পড়ো।",
    },
    {
      icon: Compass,
      title: "গাইডেড",
      detail: "সমাধান দেখে দেখে ২টি সমস্যা হাতে-কলমে করো।",
    },
    {
      icon: Dumbbell,
      title: "প্র্যাকটিস",
      detail: "নিজে চেষ্টা করো—সহজ থেকে কঠিন ক্রমে।",
    },
    {
      icon: Flag,
      title: "চেকপয়েন্ট",
      detail: checkpoint
        ? `${checkpoint.durationMinutes} মিনিটে ${checkpoint.problemCount}টি সমস্যা; সব সলভ করলে ব্যাজ।`
        : "মডিউল লঞ্চের সাথে টাইমড চেকপয়েন্ট আসবে।",
    },
  ];
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/**
 * Course-level overview shown right under the module header: the promise,
 * prerequisites, time budget, the four-step rhythm and—for the ShopSphere
 * tracks—the dataset and a real query example.
 */
export function CourseOverview({
  module,
  isSql,
  className,
}: {
  module: LearningModuleView;
  isSql?: boolean;
  className?: string;
}) {
  const sql = isSql ?? false;
  const guidedCount = module.topics.reduce(
    (total, topic) => total + topic.guided.length,
    0,
  );
  const practiceCount = module.topics.reduce(
    (total, topic) =>
      total +
      topic.practice.easy.length +
      topic.practice.medium.length +
      topic.practice.hard.length,
    0,
  );
  const derivedOutcomes: Outcome[] = pickOutcomeTopics(module.topics, sql).map(
    (topic) => ({ title: topic.titleBn, detail: topic.summary }),
  );
  const outcomes = [...derivedOutcomes, ...(sql ? SQL_OUTCOMES : [])];
  const steps = learningSteps(module, sql);
  const prerequisites = prerequisitesFor(module, sql);
  const checkpoint = module.checkpoint;

  return (
    <section className={cn(className)}>
      <SectionHeading
        title="Course overview"
        description="The promise, the time budget, and the path you will follow."
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Target className="size-3.5" aria-hidden="true" />
            কোর্স ব্রিফ
          </p>
          <p lang="bn" className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {brief(module)}
          </p>

          <h3
            lang="bn"
            className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold"
          >
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            এই কোর্স শেষে তুমি পারবে
          </h3>
          <ul
            lang="bn"
            role="list"
            className="mt-3 grid gap-x-4 gap-y-2.5 sm:grid-cols-2"
          >
            {outcomes.map((outcome) => (
              <li key={outcome.title} className="flex min-w-0 gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-primary/80"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug">
                    {outcome.title}
                  </p>
                  {outcome.detail ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {outcome.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="min-w-0 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="size-4 text-primary" aria-hidden="true" />
              ফরম্যাট ও সময়
            </h3>
            <dl lang="bn" className="mt-3 grid grid-cols-2 gap-2">
              <Stat icon={Clock3} label="মোট সময়" value={`${module.estimatedHours} ঘণ্টা`} />
              <Stat icon={Layers3} label="টপিক" value={`${module.topics.length}টি`} />
              <Stat
                icon={ListChecks}
                label="মোট সমস্যা"
                value={`${guidedCount + practiceCount}টি`}
              />
              <Stat icon={Flag} label="চেকপয়েন্ট" value={checkpoint ? `${checkpoint.durationMinutes} মিনিট` : "লঞ্চে"} />
            </dl>
          </Card>

          <Card className="min-w-0 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Compass className="size-4 text-primary" aria-hidden="true" />
              শুরু করার আগে
            </h3>
            <ul
              lang="bn"
              role="list"
              className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground"
            >
              {prerequisites.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-4 min-w-0 p-5 sm:p-6">
        <h3 lang="bn" className="flex items-center gap-2 text-sm font-semibold">
          <Layers3 className="size-4 text-primary" aria-hidden="true" />
          কীভাবে শিখবে
        </h3>
        <ol
          lang="bn"
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-lg border border-border bg-background/50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-[13px] font-semibold">{step.title}</p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      {sql ? (
        <>
          <SqlQueryPipeline className="mt-4" />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Database className="size-4 text-primary" aria-hidden="true" />
                <h3 lang="bn" className="text-sm font-semibold">
                  ShopSphere ডেটাসেট
                </h3>
                <Badge variant="outline" className="font-mono">
                  ১৯টি টেবিল
                </Badge>
              </div>
              <p lang="bn" className="mt-2 text-xs leading-relaxed text-muted-foreground">
                একটি মাল্টি-ভেন্ডর মার্কেটপ্লেসের বাস্তব ডেটা—ভেন্ডর ও
                কাস্টমার থেকে পেমেন্ট, শিপমেন্ট, রিটার্ন, কুপন, কার্ট, স্টক
                মুভমেন্ট আর ভেন্ডর পেআউট পর্যন্ত।
              </p>
              <dl lang="bn" className="mt-3 space-y-2">
                {SQL_DATASET_GROUPS.map((group) => (
                  <div key={group.label}>
                    <dt className="text-[11px] font-semibold text-foreground">
                      {group.label}
                    </dt>
                    <dd className="mt-0.5 break-words font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                      {group.tables}
                    </dd>
                  </div>
                ))}
              </dl>
              <p lang="bn" className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                দাম সেন্টে রাখা (৪৫০০০০ = ৳৪,৫০০), তাই রিপোর্টে ১০০ দিয়ে ভাগ
                করতে হয়। <span className="font-mono">product_attributes.attributes</span>{" "}
                JSON কলাম, আর <span className="font-mono">inventory_movements</span>{" "}
                স্টকের ইতিহাস রাখে।
              </p>
            </Card>

            <Card className="min-w-0 p-5">
              <h3 lang="bn" className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="size-4 text-primary" aria-hidden="true" />
                বাস্তব উদাহরণ
              </h3>
              <p lang="bn" className="mt-2 text-xs leading-relaxed text-muted-foreground">
                প্রথম তিনটি অর্ডার—ভেন্ডর, তারিখ, স্ট্যাটাস আর অর্ডার-মূল্য
                একসাথে। এখানেই JOIN আর GROUP BY-এর প্রথম স্বাদ।
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[300px] border-collapse text-xs">
                  <caption className="sr-only">
                    ShopSphere-এর প্রথম তিনটি অর্ডার: ভেন্ডর, শহর, অর্ডার
                    নম্বর, তারিখ, স্ট্যাটাস ও মোট টাকা।
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["ভেন্ডর", "শহর", "অর্ডার", "তারিখ", "স্ট্যাটাস", "মোট"].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className={cn(
                              "py-1.5 pr-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground last:pr-0 last:text-right",
                              heading === "শহর" && "hidden sm:table-cell",
                            )}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody lang="bn">
                    {SQL_EXAMPLE_ORDERS.map((order) => (
                      <tr key={order.order} className="border-b border-border/70 last:border-0">
                        <td className="whitespace-nowrap py-2 pr-2 font-medium">
                          {order.vendor}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-2 text-muted-foreground hidden sm:table-cell">
                          {order.city}
                        </td>
                        <td className="py-2 pr-2 font-mono text-muted-foreground">
                          {order.order}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {order.date}
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant={order.status === "paid" ? "success" : "warning"} className="font-mono text-[10px]">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap py-2 text-right font-mono tabular-nums">
                          {order.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[10.5px] leading-relaxed text-foreground">
                <code>{`SELECT v.name, o.id, o.ordered_at, o.status,
       SUM(oi.quantity * oi.unit_price_cents) / 100.0 AS total_bdt
FROM vendors v
JOIN products p ON p.vendor_id = v.id
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
GROUP BY v.id, o.id, o.ordered_at, o.status
ORDER BY o.id LIMIT 3;`}</code>
              </pre>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
