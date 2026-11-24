import { User, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CONTEST_FORMAT_LABEL,
  CONTEST_TEAM_MAX_SIZE,
  CONTEST_TEAM_MIN_SIZE,
  type ContestFormat,
} from "@/lib/contest-ops";
import { cn } from "@/lib/utils";

export function contestTeamSizeLabel(teamSize?: number | null): string {
  if (teamSize && teamSize >= CONTEST_TEAM_MIN_SIZE) {
    return `${teamSize} per team`;
  }
  return `${CONTEST_TEAM_MIN_SIZE}–${CONTEST_TEAM_MAX_SIZE} per team`;
}

export function ContestFormatBadge({
  format,
  teamSize,
  showTeamSize = true,
  className,
}: {
  format: ContestFormat;
  teamSize?: number | null;
  showTeamSize?: boolean;
  className?: string;
}) {
  const isGroup = format === "GROUP";
  const Icon = isGroup ? UsersRound : User;
  const detail = isGroup ? contestTeamSizeLabel(teamSize) : "Individual entry";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-border bg-muted/40 font-medium text-muted-foreground",
        className,
      )}
      title={
        isGroup && showTeamSize
          ? `${CONTEST_FORMAT_LABEL[format]} — ${detail}`
          : CONTEST_FORMAT_LABEL[format]
      }
    >
      <Icon className="size-3" aria-hidden="true" />
      <span>{CONTEST_FORMAT_LABEL[format]}</span>
      {isGroup && showTeamSize ? (
        <span className="text-muted-foreground/80">· {detail}</span>
      ) : null}
    </Badge>
  );
}
