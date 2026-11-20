import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTone = "primary" | "success" | "warning" | "danger" | "neutral";

const TONE_CLASS: Record<MetricTone, string> = {
  primary: "bg-primary/10 text-primary",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  neutral: "bg-muted text-muted-foreground",
};

export function DashboardMetric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            TONE_CLASS[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const classes = cn(
    "relative overflow-hidden p-4 transition-colors",
    href && "hover:border-primary/30 hover:bg-primary/[0.02]",
    className,
  );

  if (href) {
    return (
      <Card className={classes}>
        <Link href={href} className="block focus-visible:outline-none">
          {content}
        </Link>
      </Card>
    );
  }

  return <Card className={classes}>{content}</Card>;
}
