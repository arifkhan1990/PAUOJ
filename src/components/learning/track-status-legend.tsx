import { Award, Clock3, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TrackStatusLegend() {
  return (
    <div
      role="group"
      aria-label="Track status legend"
      className="flex flex-wrap items-center gap-2"
    >
      <Badge variant="success">
        <span
          className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300"
          aria-hidden="true"
        />
        Live
      </Badge>
      <Badge variant="muted">
        <LockKeyhole className="size-3" aria-hidden="true" />
        Locked
      </Badge>
      <Badge variant="secondary">
        <Clock3 className="size-3" aria-hidden="true" />
        Planned
      </Badge>
      <Badge variant="warning">
        <Award className="size-3" aria-hidden="true" />
        Badge earned
      </Badge>
    </div>
  );
}
