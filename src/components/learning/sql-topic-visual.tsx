import { ArrowLeftRight, Lightbulb, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATA_ARTS } from "./sql-topic-diagrams-data";
import { FLOW_ARTS } from "./sql-topic-diagrams-flow";
import type { AreaArt } from "./sql-topic-diagram-kit";

type ArtKey =
  | "dataset"
  | "joins"
  | "leftjoin"
  | "nested"
  | "venn"
  | "bars"
  | "window"
  | "tree"
  | "btree"
  | "txn"
  | "json"
  | "pages"
  | "dates"
  | "funnel"
  | "pivot"
  | "lifecycle"
  | "pipeline";

type Visual = { title: string; example: string; art: ArtKey };

/** Every SQL topic slug gets a diagram; anything new falls back to the pipeline. */
const VISUALS: Record<string, Visual> = {
  orientation: {
    title: "ডেটাসেটের মানচিত্র",
    art: "dataset",
    example: "ভেন্ডর, প্রোডাক্ট আর অর্ডার—প্রথমে টেবিল চিনে SELECT/WHERE দিয়ে প্রথম তালিকা।",
  },
  "money-and-orders": {
    title: "ভেন্ডরভিত্তিক রেভিনিউ",
    art: "bars",
    example: "প্রথম তিন অর্ডারে TechNest ৳8,900, BookBazar ৳1,800, StyleHub ৳6,000।",
  },
  "missing-rows": {
    title: "LEFT JOIN-এ ফাঁকা সারি",
    art: "leftjoin",
    example: "যে প্রোডাক্ট কখনো বিক্রি হয়নি—products LEFT JOIN order_items-এ ওদের দিকে NULL।",
  },
  subqueries: {
    title: "ভিতরের query আগে",
    art: "nested",
    example: "ক্যাটাগরির গড়ের চেয়ে দামি প্রোডাক্ট: ভিতরের AVG আগে, বাইরের WHERE পরে।",
  },
  "joins-in-depth": {
    title: "দুটি টেবিল, একটি মিল",
    art: "joins",
    example: "vendors আর orders vendor_id দিয়ে জোড়া—প্রতি অর্ডারের ভেন্ডর-নাম পাওয়া যায়।",
  },
  "set-operations": {
    title: "সেট: UNION ও EXCEPT",
    art: "venn",
    example: "অর্ডার করা কিন্তু রিভিউ না দেওয়া কাস্টমার—orders EXCEPT reviews।",
  },
  "text-and-dates": {
    title: "টেক্সট আর তারিখ",
    art: "dates",
    example: "ঢাকার ভেন্ডর: city LIKE 'Dha%' আর ordered_at BETWEEN দুটো তারিখ।",
  },
  "text-dates-time": {
    title: "টেক্সট আর তারিখ",
    art: "dates",
    example: "মাসভিত্তিক রিপোর্ট: date_trunc('month', ordered_at) দিয়ে অর্ডার ভাগ।",
  },
  "order-lifecycle": {
    title: "অর্ডারের অবস্থা",
    art: "lifecycle",
    example: "orders.status: pending → paid → shipped → delivered; রিটার্ন এলে refund।",
  },
  pagination: {
    title: "পেজ বাই পেজ",
    art: "pages",
    example: "নতুন ১০টি অর্ডার: ORDER BY ordered_at DESC LIMIT 10 OFFSET 10।",
  },
  "window-thinking": {
    title: "উইন্ডো ফ্রেম",
    art: "window",
    example: "প্রতি ক্যাটাগরির সেরা: RANK() OVER (PARTITION BY category_id ORDER BY revenue DESC)।",
  },
  timelines: {
    title: "চলমান মেট্রিক",
    art: "window",
    example: "৭ দিনের চলমান গড়: ROWS BETWEEN 6 PRECEDING AND CURRENT ROW।",
  },
  "advanced-windows": {
    title: "উইন্ডো ফ্রেম",
    art: "window",
    example: "LAG/LEAD দিয়ে আগের-পরের অর্ডারের ব্যবধান, ফ্রেম দিয়ে চলমান SUM।",
  },
  hierarchies: {
    title: "ক্যাটাগরি ট্রি",
    art: "tree",
    example: "Electronics → Audio → Headphones; recursive CTE parent_id ধরে path বানায়।",
  },
  "business-metrics": {
    title: "মাস × ক্যাটাগরি",
    art: "pivot",
    example: "প্রতি মাসে ক্যাটাগরির share = category revenue ÷ ওই মাসের মোট revenue।",
  },
  "funnels-coupons": {
    title: "ফানেলের ধাপ",
    art: "funnel",
    example: "carts → orders → payments ধাপে ঝরে যাওয়া; coupon_redemptions দিয়ে attribution।",
  },
  "pivot-grouping": {
    title: "পিভট গ্রিড",
    art: "pivot",
    example: "সারিতে ক্যাটাগরি, কলামে মাস—CASE + SUM দিয়ে pivot টেবিল।",
  },
  "json-inventory": {
    title: "JSON ও স্টক",
    art: "json",
    example: "product_attributes.attributes JSON থেকে color; inventory_movements-এ স্টকের ইতিহাস।",
  },
  "finance-reconciliation": {
    title: "লেনদেন: commit/rollback",
    art: "txn",
    example: "vendor_payouts: net = gross − commission − refund; গরমিল হলে ROLLBACK।",
  },
  "query-performance": {
    title: "B-tree ইনডেক্স",
    art: "btree",
    example: "orders(ordered_at)-এ index থাকলে পুরো টেবিল scan না করে দরকারি পাতা পড়ে।",
  },
  capstone: {
    title: "ধাপে ধাপে রিপোর্ট",
    art: "pipeline",
    example: "ভেন্ডর scorecard + cohort retention—একাধিক CTE ধরে ধরে এক রিপোর্ট।",
  },
};

const FALLBACK_VISUAL: Visual = {
  title: "query-এর ধাপ",
  art: "pipeline",
  example: "যে query-ই লেখো, ডেটাবেস প্রথমে টেবিল জোড়া লাগিয়ে তারপর ফিল্টার করে।",
};

const ARTS: Record<string, AreaArt> = { ...DATA_ARTS, ...FLOW_ARTS };

/**
 * Topic-level diagram for the ShopSphere SQL tracks. Artwork is inline SVG
 * driven by site tokens and currentColor, labelled with `<title>/<desc>`; the
 * real-data example sits in the caption so the picture never teaches alone.
 */
export function SqlTopicVisual({
  topicSlug,
  className,
}: {
  topicSlug: string;
  className?: string;
}) {
  const visual = VISUALS[topicSlug] ?? FALLBACK_VISUAL;
  const Art = ARTS[visual.art] ?? ARTS.pipeline;

  return (
    <figure
      className={cn(
        "not-prose min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex items-start gap-2 border-b border-border bg-muted/25 px-4 py-3">
        <Network className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Concept diagram
          </p>
          <h3 lang="bn" className="mt-0.5 text-sm font-semibold leading-snug">
            {visual.title}
          </h3>
        </div>
      </div>

      <div
        role="region"
        aria-label="Concept diagram"
        tabIndex={0}
        className="overflow-x-auto bg-background/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-4"
      >
        <svg
          viewBox="0 0 480 190"
          role="img"
          aria-labelledby="sql-topic-visual-title"
          aria-describedby="sql-topic-visual-desc"
          className="h-auto w-full min-w-[360px] text-foreground"
        >
          <title id="sql-topic-visual-title">{visual.title}</title>
          <desc id="sql-topic-visual-desc">{visual.example}</desc>
          <defs>
            <marker
              id="sql-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 Z" className="fill-muted-foreground" />
            </marker>
          </defs>
          <Art />
        </svg>
      </div>

      <p lang="bn" className="flex items-center gap-1.5 border-t border-border px-4 py-1.5 text-[10.5px] text-muted-foreground sm:hidden">
        <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden="true" />
        ডায়াগ্রামটি পাশে স্ক্রল করো
      </p>

      <figcaption
        lang="bn"
        className="flex items-start gap-2 border-t border-border bg-muted/15 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground"
      >
        <Lightbulb
          className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <span>
          <span className="font-medium text-foreground">ShopSphere:</span>{" "}
          {visual.example}
        </span>
      </figcaption>
    </figure>
  );
}
