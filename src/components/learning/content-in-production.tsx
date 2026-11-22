import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContentInProduction({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3",
        className,
      )}
    >
      <Hammer
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium">Content in production</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          The outline is published so you can plan ahead. Concept notes and
          problem sets are being authored for a future release.
        </p>
      </div>
    </div>
  );
}
