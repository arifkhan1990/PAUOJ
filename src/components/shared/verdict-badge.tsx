import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isPendingVerdict, verdictMeta } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

export function VerdictBadge({
  status,
  short = false,
  className,
}: {
  status: string;
  short?: boolean;
  className?: string;
}) {
  const meta = verdictMeta(status);
  const pending = isPendingVerdict(status);
  return (
    <Badge
      className={cn("gap-1.5 font-medium", meta.className, className)}
      title={meta.description}
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      )}
      {short ? meta.short : meta.label}
    </Badge>
  );
}
