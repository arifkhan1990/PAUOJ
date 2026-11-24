// Renders the "complexity" lesson visual: growth curves for O(...) classes.
import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

type Shape = (t: number) => number;

const DEFAULT_LABELS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"];
const TONES = [
  { line: "stroke-muted-foreground", swatch: "bg-muted-foreground" },
  { line: "stroke-success", swatch: "bg-success" },
  { line: "stroke-primary", swatch: "bg-primary" },
  { line: "stroke-accent", swatch: "bg-accent" },
  { line: "stroke-destructive", swatch: "bg-destructive" },
];

const X0 = 32;
const PLOT_W = 282;
const PLOT_TOP = 14;
const PLOT_H = 116;
const SAMPLES = Array.from({ length: 26 }, (_, index) => index / 25);

function logCurve(t: number): number {
  return Math.log2(1 + 9 * t) / Math.log2(10);
}

function shapeFor(label: string): Shape {
  const key = label.toLowerCase().replace(/\s+/g, "");
  if (key.includes("nlogn")) {
    return (t) => 0.78 * t * (0.55 + 0.45 * logCurve(t));
  }
  if (key.includes("log")) return (t) => 0.35 * logCurve(t);
  if (key.includes("n2") || key.includes("n²") || key.includes("n^2") || key.includes("quad")) {
    return (t) => t * t;
  }
  if (key.includes("n")) return (t) => 0.58 * t;
  return () => 0.08;
}

function pointsFor(shape: Shape): string {
  return SAMPLES.map((t) => {
    const x = X0 + t * PLOT_W;
    const y = PLOT_TOP + (1 - shape(t)) * PLOT_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export function ComplexityVisual({ config, compact = false }: VisualProps) {
  const labels = (config.data?.labels?.length ? config.data.labels : DEFAULT_LABELS).slice(0, 6);

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <svg
          viewBox="0 0 330 158"
          className={cn("h-auto w-full", compact && "max-h-40")}
          aria-hidden="true"
        >
          <text x="2" y="12" fontSize={12} className="fill-muted-foreground">
            সময়
          </text>
          <text x="292" y="152" fontSize={12} className="fill-muted-foreground">
            ইনপুট n →
          </text>

          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={X0}
              y1={PLOT_TOP + PLOT_H * ratio}
              x2={X0 + PLOT_W}
              y2={PLOT_TOP + PLOT_H * ratio}
              className="stroke-border"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}

          <line
            x1={X0}
            y1={PLOT_TOP + PLOT_H}
            x2={X0 + PLOT_W + 8}
            y2={PLOT_TOP + PLOT_H}
            className="stroke-border"
            strokeWidth="1.5"
          />
          <line
            x1={X0}
            y1={PLOT_TOP + PLOT_H + 6}
            x2={X0}
            y2={PLOT_TOP - 4}
            className="stroke-border"
            strokeWidth="1.5"
          />

          {labels.map((label, index) => (
            <polyline
              key={`${label}-${index}`}
              points={pointsFor(shapeFor(label))}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("lv-draw", TONES[index % TONES.length].line)}
              style={{ "--lv-length": 420, animationDelay: `${index * 0.18}s` } as CSSProperties}
            />
          ))}
        </svg>

        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {labels.map((label, index) => (
            <li
              key={`${label}-${index}`}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
            >
              <span
                className={cn("h-0.5 w-4 rounded-full", TONES[index % TONES.length].swatch)}
              />
              {label}
            </li>
          ))}
        </ul>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          উপরের বাঁক যত খাড়া, ইনপুট বাড়লে সময় তত দ্রুত বাড়ে।
        </p>
      </div>
    </VisualFrame>
  );
}
