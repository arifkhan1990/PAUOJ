import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export function SolveStatus({
  solved,
  attempted,
  className,
}: {
  solved: boolean;
  attempted: boolean;
  className?: string;
}) {
  if (solved) {
    return (
      <span title="Solved" className={cn("inline-flex text-emerald-600 dark:text-emerald-400", className)}>
        <CheckCircle2 className="size-4" />
      </span>
    );
  }
  if (attempted) {
    return (
      <span title="Attempted" className={cn("inline-flex text-amber-600 dark:text-amber-400", className)}>
        <CircleDot className="size-4" />
      </span>
    );
  }
  return (
    <span title="Unsolved" className={cn("inline-flex text-muted-foreground/60", className)}>
      <Circle className="size-4" />
    </span>
  );
}
