import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type RingSize = "sm" | "md" | "lg";

const RING_SIZES: Record<
  RingSize,
  {
    diameter: number;
    stroke: number;
    valueClassName: string;
    iconClassName: string;
  }
> = {
  sm: {
    diameter: 40,
    stroke: 4,
    valueClassName: "text-[10px]",
    iconClassName: "size-3.5",
  },
  md: {
    diameter: 72,
    stroke: 6,
    valueClassName: "text-base",
    iconClassName: "size-5",
  },
  lg: {
    diameter: 104,
    stroke: 8,
    valueClassName: "text-2xl",
    iconClassName: "size-7",
  },
};

/**
 * Server-rendered progress ring. The percentage stays in the centre (a check
 * replaces it when complete) and the wrapper exposes the same numbers to
 * assistive tech, so progress is never colour-only.
 */
export function PlanProgressRing({
  percent,
  solved,
  total,
  size = "md",
  label,
  className,
}: {
  percent: number;
  solved: number;
  total: number;
  size?: RingSize;
  label?: string;
  className?: string;
}) {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const value = Math.min(100, Math.max(0, Math.round(safePercent)));
  const { diameter, stroke, valueClassName, iconClassName } = RING_SIZES[size];
  const center = diameter / 2;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - value / 100);
  const complete = value >= 100 && total > 0;
  const ariaLabel =
    label ?? `${solved} of ${total} problems solved (${value}%)`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        className,
      )}
      style={{ width: diameter, height: diameter }}
    >
      <svg
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="size-full"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        {value > 0 ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            className={cn(
              "transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none",
              complete ? "stroke-success" : "stroke-primary",
            )}
          />
        ) : null}
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 grid place-items-center font-semibold tabular-nums",
          valueClassName,
          complete ? "text-success" : "text-foreground",
        )}
      >
        {complete ? (
          <Check className={iconClassName} strokeWidth={3} />
        ) : (
          <span className="inline-flex items-baseline leading-none">{value}<span className="text-[0.62em] font-medium text-muted-foreground">%</span></span>
        )}
      </span>
    </div>
  );
}
