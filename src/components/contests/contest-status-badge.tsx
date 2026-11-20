import { Badge } from "@/components/ui/badge";
import { CONTEST_STATUS_META } from "@/lib/contests";
import type { ContestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ContestStatusBadge({
  status,
  className,
}: {
  status: ContestStatus;
  className?: string;
}) {
  const meta = CONTEST_STATUS_META[status];
  return (
    <Badge className={cn("gap-1.5", meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </Badge>
  );
}
