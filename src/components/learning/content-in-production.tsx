import { Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ContentInProduction({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4",
        className,
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground"
        aria-hidden="true"
      >
        <Hammer className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">Content in production</p>
          <Badge variant="muted">Planned</Badge>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          The outline is published so you can plan ahead. Concept notes and
          problem sets are being authored for a future release.
        </p>
      </div>
    </div>
  );
}
