import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LearningLocked({
  hint,
  className,
}: {
  hint: string | null;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-dashed bg-muted/20", className)}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-xs"
            aria-hidden="true"
          >
            <LockKeyhole className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Locked for now</h2>
              <Badge variant="muted">Locked</Badge>
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {hint ??
                "Complete the previous module checkpoint to unlock the next learning track."}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
              Tracks open in order, so you always build on what you just finished.
            </p>
          </div>
        </div>
        <Link
          href="/learn"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0 self-start",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All tracks
        </Link>
      </div>
    </Card>
  );
}
