import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Flag,
  Layers3,
  LayoutList,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getLessonPagerData,
  getTrackPagerData,
  type PagerEyebrow,
} from "@/lib/learning/sequence";
import type { LearningModuleDefinition } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { pad } from "./topic-lesson-parts";

type PagerKind = "overview" | "topic" | "checkpoint" | "track";

type PagerCardItem = {
  kind: PagerKind;
  href: string;
  eyebrow: PagerEyebrow;
  title: string;
  subtitle?: string;
  meta?: string;
};

const KIND_ICONS: Record<PagerKind, LucideIcon> = {
  overview: LayoutList,
  topic: BookOpen,
  checkpoint: Flag,
  track: Layers3,
};

/** Topic `Topic 03 of 10` / track `Track 02 of 11` progress line + bar. */
function PagerProgress({
  label,
  position,
  total,
}: {
  label: string;
  position: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((position / total) * 100) : 0;

  return (
    <div className="min-w-0">
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-primary">
        {label}
      </p>
      <div
        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PagerCard({ item }: { item: PagerCardItem }) {
  const Icon = KIND_ICONS[item.kind];
  const isPrevious = item.eyebrow === "Previous";
  const Arrow = isPrevious ? ArrowLeft : ArrowRight;

  return (
    <Card className="group h-full min-w-0 p-0 transition-colors hover:border-primary/45 hover:bg-muted/20 focus-within:border-primary/45">
      <Link
        href={item.href}
        rel={isPrevious ? "prev" : "next"}
        className={cn(
          "flex h-full min-h-11 min-w-0 items-start gap-3 rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-4 sm:p-5",
          !isPrevious && "sm:flex-row-reverse",
        )}
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Arrow className="size-3.5 shrink-0" aria-hidden="true" />
            {item.eyebrow}
            {item.kind === "checkpoint" ? (
              <span className="rounded-full border border-primary/25 bg-primary/[0.06] px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-primary">
                Final checkpoint
              </span>
            ) : null}
          </span>

          <span className="mt-1.5 block break-words text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {item.title}
          </span>

          {item.subtitle ? (
            <span
              lang="bn"
              className="mt-0.5 block break-words text-xs leading-relaxed text-muted-foreground"
            >
              {item.subtitle}
            </span>
          ) : null}

          {item.meta ? (
            <span className="mt-1.5 block break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {item.meta}
            </span>
          ) : null}
        </span>
      </Link>
    </Card>
  );
}

function PagerPlaceholder({ label }: { label: string }) {
  return (
    <Card className="flex h-full min-h-11 items-center gap-3 border-dashed bg-muted/15 p-4 text-xs text-muted-foreground sm:p-5">
      <Layers3 className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{label}</span>
    </Card>
  );
}

function PagerFooterLinks({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
}) {
  const linkClass =
    "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5">
      {backHref ? (
        <Link href={backHref} className={linkClass}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to track
          <span className="sr-only">: {backLabel}</span>
        </Link>
      ) : null}
      <Link href="/learn" className={linkClass}>
        <Layers3 className="size-3.5" aria-hidden="true" />
        All learning tracks
      </Link>
    </div>
  );
}

export function LessonPager({
  module,
  topicSlug,
  className,
}: {
  module: LearningModuleDefinition;
  topicSlug: string;
  className?: string;
}) {
  const data = getLessonPagerData(module, topicSlug);
  if (!data) return null;

  return (
    <nav aria-label="Lesson navigation" className={cn("min-w-0", className)}>
      <PagerProgress
        label={`Topic ${pad(data.position)} of ${pad(data.total)}`}
        position={data.position}
        total={data.total}
      />

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <PagerCard item={data.previous} />
        <PagerCard item={data.next} />
      </div>

      <PagerFooterLinks backHref={data.backHref} backLabel={data.backLabel} />
    </nav>
  );
}

export function TrackPager({
  moduleSlug,
  className,
}: {
  moduleSlug: string;
  className?: string;
}) {
  const data = getTrackPagerData(moduleSlug);
  if (!data) return null;

  return (
    <nav aria-label="Track navigation" className={cn("min-w-0", className)}>
      <PagerProgress
        label={`Track ${pad(data.position)} of ${pad(data.total)}`}
        position={data.position}
        total={data.total}
      />

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {data.previous ? (
          <PagerCard item={{ ...data.previous, kind: "track" }} />
        ) : (
          <PagerPlaceholder label="First track — the start of the curriculum." />
        )}
        {data.next ? (
          <PagerCard item={{ ...data.next, kind: "track" }} />
        ) : (
          <PagerPlaceholder label="Last track — you have reached the end." />
        )}
      </div>

      <PagerFooterLinks />
    </nav>
  );
}
