import {
  CircleCheck,
  ListChecks,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProblemLanguageChart } from "@/features/problems/problem-language-chart";
import { ProblemVerdictChart } from "@/features/problems/problem-verdict-chart";
import type { ProblemStatistics } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight tabular-nums">
          {value}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function ProblemStats({
  statistics,
  solverCount,
}: {
  statistics: ProblemStatistics;
  solverCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={ListChecks}
          label="Submissions"
          value={statistics.submissionCount.toLocaleString("en-US")}
        />
        <StatTile
          icon={CircleCheck}
          label="Accepted"
          value={statistics.acceptedCount.toLocaleString("en-US")}
        />
        <StatTile
          icon={TrendingUp}
          label="Success rate"
          value={formatPercent(statistics.successRate)}
        />
        <StatTile
          icon={Users}
          label="Solvers"
          value={solverCount.toLocaleString("en-US")}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ProblemVerdictChart statistics={statistics} />
        <ProblemLanguageChart statistics={statistics} />
      </div>
    </div>
  );
}
