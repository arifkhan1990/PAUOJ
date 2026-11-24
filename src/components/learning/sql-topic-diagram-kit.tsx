import type { ReactElement, ReactNode } from "react";

export type Tone = "muted" | "primary" | "accent";
export type AreaArt = () => ReactElement;

const TONE_TEXT: Record<Tone, string> = {
  muted: "fill-muted-foreground",
  primary: "fill-primary",
  accent: "fill-accent",
};

/** Small text primitive so every diagram shares the same token colours. */
export function Txt({
  x,
  y,
  size = 11,
  weight = 500,
  anchor = "start",
  tone = "muted",
  children,
}: {
  x: number;
  y: number;
  size?: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  tone?: Tone | "foreground";
  children: ReactNode;
}) {
  const fill = tone === "foreground" ? "fill-foreground" : TONE_TEXT[tone];
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} textAnchor={anchor} className={fill}>
      {children}
    </text>
  );
}

/** Rounded label chip used for query stages, pages and states. */
export function Chip({
  x,
  y,
  w,
  h = 28,
  tone = "muted",
  size = 11,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  tone?: Tone;
  size?: number;
  children: string;
}) {
  const fill =
    tone === "primary"
      ? "fill-primary/10 stroke-primary/60"
      : tone === "accent"
        ? "fill-accent/10 stroke-accent/60"
        : "fill-card stroke-border";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} strokeWidth={1.2} className={fill} />
      <Txt
        x={x + w / 2}
        y={y + h / 2 + 4}
        anchor="middle"
        size={size}
        weight={600}
        tone={tone === "muted" ? "foreground" : tone}
      >
        {children}
      </Txt>
    </g>
  );
}

/** Three-row mini table with optional highlighted and NULL rows. */
export function TableArt({
  x,
  title,
  rows,
  accentRows = [],
  nullRows = [],
  nullLabel = "NULL",
}: {
  x: number;
  title: string;
  rows: string[];
  accentRows?: number[];
  nullRows?: number[];
  nullLabel?: string;
}) {
  return (
    <g>
      <rect x={x} y={24} width={164} height={128} rx={10} strokeWidth={1.4} className="fill-card stroke-border" />
      <Txt x={x + 12} y={45} size={12} weight={700} tone="foreground">
        {title}
      </Txt>
      {rows.map((row, index) => {
        const isNull = nullRows.includes(index);
        const fill = isNull
          ? "fill-destructive/10 stroke-destructive/50"
          : accentRows.includes(index)
            ? "fill-primary/10 stroke-primary/50"
            : "fill-muted/40 stroke-border";
        return (
          <g key={`${title}-${row}-${index}`}>
            <rect x={x + 10} y={56 + index * 28} width={144} height={22} rx={5} strokeWidth={1} className={fill} />
            <text
              x={x + 18}
              y={71 + index * 28}
              fontSize={10.5}
              className={isNull ? "fill-destructive" : "fill-foreground"}
            >
              {row || nullLabel}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Rounded node used by the tree and B-tree diagrams. */
export function SvgNode({
  cx,
  y,
  label,
  active = false,
  w = 88,
  size = 9.5,
}: {
  cx: number;
  y: number;
  label: string;
  active?: boolean;
  w?: number;
  size?: number;
}) {
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={y}
        width={w}
        height={26}
        rx={7}
        strokeWidth={1.2}
        className={active ? "fill-primary/10 stroke-primary" : "fill-card stroke-border"}
      />
      <text
        x={cx}
        y={y + 17}
        textAnchor="middle"
        fontSize={size}
        fontWeight={600}
        className={active ? "fill-primary" : "fill-foreground"}
      >
        {label}
      </text>
    </g>
  );
}
