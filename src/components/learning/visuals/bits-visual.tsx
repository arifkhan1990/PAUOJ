// Renders the "bits" lesson visual: two binary rows and an XOR/AND/shift result.
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_VALUES = [6, 3];
const MAX_BITS = 8;

function isBinary(value: string | undefined): value is string {
  return typeof value === "string" && /^[01]{1,8}$/.test(value);
}

function toBinary(value: number, width: number): string {
  const mask = 2 ** width - 1;
  return (Math.max(0, Math.trunc(value)) & mask).toString(2).padStart(width, "0");
}

function applyOp(a: number, b: number, op: string): number {
  if (op === "AND") return a & b;
  if (op === "OR") return a | b;
  return a ^ b;
}

export function BitsVisual({ config, compact = false }: VisualProps) {
  const values = (config.data?.values ?? DEFAULT_VALUES).filter(Number.isFinite).slice(0, 2);
  const labels = config.data?.labels ?? [];
  const variant = (config.data?.variant ?? "xor").toLowerCase();
  const isShift = variant.includes("shift");
  const op = variant.includes("and") ? "AND" : variant.includes("xor") ? "XOR" : "OR";

  // Binary labels are the source of truth for what the cells show, so the
  // expression below always agrees with the visible bits.
  const a = isBinary(labels[0])
    ? parseInt(labels[0], 2)
    : Math.max(0, Math.trunc(values[0] ?? DEFAULT_VALUES[0]));
  const b = isBinary(labels[1])
    ? parseInt(labels[1], 2)
    : Math.max(0, Math.trunc(values[1] ?? DEFAULT_VALUES[1]));

  const rawA = isBinary(labels[0]) ? labels[0] : toBinary(a, Math.max(3, a.toString(2).length));
  const rawB = isBinary(labels[1]) ? labels[1] : toBinary(b, Math.max(3, b.toString(2).length));

  const rawResult = isShift ? a * 2 : applyOp(a, b, op);
  const width = Math.min(
    MAX_BITS,
    Math.max(3, rawA.length, isShift ? 0 : rawB.length, rawResult.toString(2).length),
  );
  const resultValue = rawResult & (2 ** width - 1);

  const bitsA = rawA.slice(-width).padStart(width, "0");
  const bitsB = rawB.slice(-width).padStart(width, "0");
  const bitsResult = toBinary(resultValue, width);
  const expression = isShift ? `${a} << 1 = ${resultValue}` : `${a} ${op} ${b} = ${resultValue}`;

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="lv-scroll overflow-x-auto pb-1">
          <div className="mx-auto flex w-max flex-col gap-2">
            <BitRow label="A" bits={bitsA} showIndex />
            {isShift ? null : <BitRow label="B" bits={bitsB} />}

            <div className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                op
              </span>
              <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground">
                {isShift ? "shift" : `${op} →`}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {isShift ? "সব বিট এক ঘর বাঁয়ে" : "বিট ধরে ধরে"}
              </span>
            </div>

            <BitRow label="=" bits={bitsResult} highlight />
          </div>
        </div>

        <p className="font-mono text-[11px] font-medium text-foreground">{expression}</p>
        {resultValue !== rawResult ? (
          <p className="text-[10px] leading-relaxed text-foreground">
            {width} বিটে ধরায় বাঁ দিকের অতিরিক্ত বিট বাদ পড়েছে।
          </p>
        ) : null}
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          1 = on, 0 = off · ডানদিকের বিট LSB, মান সবচেয়ে কম।
        </p>
      </div>
    </VisualFrame>
  );
}

function BitRow({
  label,
  bits,
  highlight = false,
  showIndex = false,
}: {
  label: string;
  bits: string;
  highlight?: boolean;
  showIndex?: boolean;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <span
        className={cn(
          "w-5 shrink-0 pt-1.5 text-right font-mono text-[10px]",
          highlight ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <div className="flex gap-1">
        {bits.split("").map((bit, index) => (
          <div key={`${label}-${index}`} className="flex flex-col items-center gap-0.5">
            {highlight ? (
              <span
                className="lv-blink size-1 rounded-full bg-accent"
                style={{ animationDelay: `${index * 0.28}s` }}
              />
            ) : (
              <span className="size-1" />
            )}
            <span
              className={cn(
                "flex items-center justify-center rounded border font-mono text-[11px] tabular-nums",
                highlight
                  ? "size-6 border-primary/50 bg-primary/10 text-foreground sm:size-7"
                  : bit === "1"
                    ? "size-6 border-border bg-muted/60 text-foreground sm:size-7"
                    : "size-6 border-border bg-card text-muted-foreground sm:size-7",
              )}
            >
              {bit}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {showIndex ? bits.length - 1 - index : "\u00a0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
