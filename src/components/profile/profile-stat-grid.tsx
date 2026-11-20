import type { ProfileStats } from "@/lib/types";
import { difficultyMeta } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

type StatTone = "default" | "success" | "danger" | "primary";

const TONE_CLASS: Record<StatTone, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-rose-600 dark:text-rose-400",
  primary: "text-primary",
};

function StatBox({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-border bg-muted/50 px-2 py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="flex min-h-[72px] flex-col items-center justify-center px-2 py-3 text-center">
        <p
          className={cn(
            "font-mono text-2xl font-semibold leading-none tabular-nums",
            TONE_CLASS[tone],
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProfileStatGrid({ profile }: { profile: ProfileStats }) {
  const hardestTried = profile.hardestTried;
  const hardestSolved = profile.hardestSolved;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatBox label="Submissions" value={profile.submissionCount.toLocaleString("en-US")} />
      <StatBox
        label="Solved"
        value={profile.solvedCount}
        tone="success"
      />
      <StatBox
        label="Hardest (Tried)"
        value={hardestTried ? hardestTried.points : "—"}
        hint={
          hardestTried ? difficultyMeta(hardestTried.difficulty).label : "none"
        }
        tone="danger"
      />
      <StatBox
        label="Hardest (Solved)"
        value={hardestSolved ? hardestSolved.points : "—"}
        hint={
          hardestSolved ? difficultyMeta(hardestSolved.difficulty).label : "none"
        }
        tone="success"
      />
      <StatBox label="Contest Attend" value={profile.contestCount} />
      <StatBox
        label="Contest Rating"
        value={profile.user.rating}
        tone="primary"
      />
      <StatBox label="Problem Setting" value={profile.problemSettingCount} />
      <StatBox
        label="Contest Create"
        value={profile.contestCreateCount}
        tone="success"
      />
    </div>
  );
}
