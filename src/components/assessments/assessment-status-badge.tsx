import { Badge } from "@/components/ui/badge";
import type {
  AssessmentParticipantStatus,
  AssessmentPhase,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const phaseClass: Record<AssessmentPhase, string> = {
  RUNNING:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  UPCOMING:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  ENDED: "border-border bg-muted text-muted-foreground",
};

const participantClass: Record<AssessmentParticipantStatus, string> = {
  ACTIVE:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  FINISHED:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  EXPIRED: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
};

export function AssessmentPhaseBadge({
  phase,
  className,
}: {
  phase: AssessmentPhase;
  className?: string;
}) {
  return (
    <Badge className={cn(phaseClass[phase], className)}>
      {phase === "RUNNING" ? "Live" : phase === "UPCOMING" ? "Upcoming" : "Ended"}
    </Badge>
  );
}

export function ParticipantStatusBadge({
  status,
  className,
}: {
  status: AssessmentParticipantStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(participantClass[status], className)}>
      {status === "ACTIVE"
        ? "In progress"
        : status === "FINISHED"
          ? "Finished"
          : "Expired"}
    </Badge>
  );
}
