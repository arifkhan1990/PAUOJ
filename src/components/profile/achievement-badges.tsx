import {
  BadgeCheck,
  Check,
  Crosshair,
  Crown,
  Flag,
  Flame,
  Gauge,
  Languages,
  Lock,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type {
  Achievement,
  AchievementIcon,
  AchievementTone,
} from "@/lib/profile-types";
import { cn } from "@/lib/utils";

const ICONS: Record<AchievementIcon, LucideIcon> = {
  check: BadgeCheck,
  target: Target,
  crosshair: Crosshair,
  crown: Crown,
  send: Send,
  flag: Flag,
  gauge: Gauge,
  trending: TrendingUp,
  trophy: Trophy,
  flame: Flame,
  languages: Languages,
};

type Palette = {
  light: string;
  mid: string;
  deep: string;
  barClassName: string;
  glowClassName: string;
};

const TONES: Record<AchievementTone, Palette> = {
  emerald: {
    light: "#6ee7b7",
    mid: "#10b981",
    deep: "#065f46",
    barClassName: "bg-emerald-500",
    glowClassName: "bg-emerald-400/25",
  },
  amber: {
    light: "#fde68a",
    mid: "#f59e0b",
    deep: "#92400e",
    barClassName: "bg-amber-500",
    glowClassName: "bg-amber-400/25",
  },
  rose: {
    light: "#fda4af",
    mid: "#f43f5e",
    deep: "#881337",
    barClassName: "bg-rose-500",
    glowClassName: "bg-rose-400/25",
  },
  sky: {
    light: "#bae6fd",
    mid: "#0ea5e9",
    deep: "#0c4a6e",
    barClassName: "bg-sky-500",
    glowClassName: "bg-sky-400/25",
  },
  teal: {
    light: "#99f6e4",
    mid: "#14b8a6",
    deep: "#115e59",
    barClassName: "bg-teal-500",
    glowClassName: "bg-teal-400/25",
  },
  orange: {
    light: "#fed7aa",
    mid: "#f97316",
    deep: "#7c2d12",
    barClassName: "bg-orange-500",
    glowClassName: "bg-orange-400/25",
  },
};

const LOCKED: Palette = {
  light: "#cbd5e1",
  mid: "#64748b",
  deep: "#1e293b",
  barClassName: "bg-muted-foreground/40",
  glowClassName: "",
};

function progressPercent(achievement: Achievement): number {
  if (achievement.target <= 0) return 100;
  return Math.min(100, (achievement.value / achievement.target) * 100);
}

export function BadgeArt({
  achievement,
  size = "md",
}: {
  achievement: Achievement;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[achievement.icon] ?? Trophy;
  const earned = achievement.earned;
  const palette = earned ? TONES[achievement.tone] : LOCKED;
  const artKey = `${achievement.id}-${size}`;
  const rimId = `badge-rim-${artKey}`;
  const plateId = `badge-plate-${artKey}`;
  const medalId = `badge-medal-${artKey}`;
  const shineId = `badge-shine-${artKey}`;

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        size === "md" ? "size-14" : "size-10",
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "h-full w-full transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.04]",
          earned
            ? "drop-shadow-[0_5px_9px_rgba(0,0,0,0.28)]"
            : "opacity-90",
        )}
      >
        <defs>
          <linearGradient id={rimId} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="50%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.deep} />
          </linearGradient>
          <linearGradient id={plateId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.24)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.10)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.44)" />
          </linearGradient>
          <radialGradient id={medalId} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="55%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.deep} />
          </radialGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <path
          d="M50 3 L94 27.5 V72.5 L50 97 L6 72.5 V27.5 Z"
          fill={`url(#${rimId})`}
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M50 9.5 L87.5 31 V69 L50 90.5 L12.5 69 V31 Z"
          fill={`url(#${plateId})`}
          stroke="rgba(0,0,0,0.30)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M50 9.5 L87.5 31 V39 L50 58.5 L12.5 39 V31 Z"
          fill="rgba(255,255,255,0.10)"
        />
        <circle cx="50" cy="50" r="25" fill="rgba(0,0,0,0.22)" />
        <circle
          cx="50"
          cy="50"
          r="22.5"
          fill={`url(#${medalId})`}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.2"
        />
        <ellipse
          cx="50"
          cy="39"
          rx="15"
          ry="7"
          fill={`url(#${shineId})`}
          opacity="0.55"
        />
        <circle
          cx="50"
          cy="50"
          r="22.5"
          fill="none"
          stroke="rgba(0,0,0,0.20)"
          strokeWidth="1"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <Icon
          className={cn(
            earned
              ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]"
              : "text-white/55",
            size === "md" ? "size-6" : "size-4",
          )}
        />
      </span>
      {!earned ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full border border-border bg-card shadow-sm",
            size === "md" ? "size-4" : "size-3.5",
          )}
        >
          <Lock className={size === "md" ? "size-2.5" : "size-2"} />
        </span>
      ) : null}
    </span>
  );
}

function BadgeTile({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const earned = achievement.earned;
  const tone = TONES[achievement.tone];
  const percent = progressPercent(achievement);
  const solved = Math.min(achievement.value, achievement.target);

  return (
    <li
      className="group flex w-1/4 min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-colors hover:bg-muted/40 sm:w-1/6"
      title={`${achievement.label} — ${achievement.description}`}
      aria-label={`${achievement.label}. ${achievement.description}. ${
        earned ? "Earned." : `${solved} of ${achievement.target}.`
      }`}
    >
      <span
        className="relative animate-badge"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {earned ? (
          <span
            className={cn(
              "absolute inset-2 rounded-full blur-lg",
              tone.glowClassName,
            )}
            aria-hidden="true"
          />
        ) : null}
        <BadgeArt achievement={achievement} />
      </span>
      <p
        className={cn(
          "w-full truncate text-[10px] font-medium leading-tight",
          earned ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {achievement.label}
      </p>
      <span className="flex h-3.5 items-center gap-1 font-mono text-[9.5px] text-muted-foreground tabular-nums">
        {earned ? (
          <>
            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
            Earned
          </>
        ) : (
          `${solved}/${achievement.target}`
        )}
      </span>
      <span className="h-1 w-full max-w-14 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "animate-bar block h-full rounded-full",
            earned ? tone.barClassName : "bg-muted-foreground/40",
          )}
          style={{
            width: `${percent}%`,
            animationDelay: `${180 + index * 30}ms`,
          }}
        />
      </span>
    </li>
  );
}

function NextUnlock({ achievement }: { achievement: Achievement | null }) {
  if (!achievement) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        Every badge unlocked. The cabinet is complete.
      </p>
    );
  }

  const tone = TONES[achievement.tone];
  const percent = progressPercent(achievement);
  const remaining = Math.max(0, achievement.target - achievement.value);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <BadgeArt achievement={achievement} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[11px] font-medium">
            <span className="text-muted-foreground">Next unlock · </span>
            {achievement.label}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
            {remaining > 0 ? `${remaining} to go` : "ready"}
          </span>
        </div>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
          <span
            className={cn("animate-bar block h-full rounded-full", tone.barClassName)}
            style={{ width: `${percent}%` }}
          />
        </span>
      </div>
    </div>
  );
}

export function AchievementBadges({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const earnedCount = achievements.filter(
    (achievement) => achievement.earned,
  ).length;
  const completion =
    achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0;
  const next =
    achievements
      .filter((achievement) => !achievement.earned)
      .sort((left, right) => progressPercent(right) - progressPercent(left))[0] ??
    null;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Milestone cabinet
            </p>
            <h2 className="text-sm font-semibold">Badges</h2>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs tabular-nums">
            <span className="font-semibold text-foreground">{earnedCount}</span>
            <span className="text-muted-foreground">/{achievements.length}</span>
          </span>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <span
              className="animate-bar block h-full rounded-full bg-amber-500"
              style={{ width: `${completion}%` }}
            />
          </span>
        </div>
      </div>

      <ul className="flex flex-wrap justify-center gap-y-1 px-2 py-3">
        {achievements.map((achievement, index) => (
          <BadgeTile
            key={achievement.id}
            achievement={achievement}
            index={index}
          />
        ))}
      </ul>

      <div className="mt-auto border-t border-border bg-muted/20 px-5 py-3">
        <NextUnlock achievement={next} />
      </div>
    </Card>
  );
}
