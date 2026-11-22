import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
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
    <Card
      className={cn(
        "flex flex-col items-start gap-4 border-dashed p-6 sm:flex-row sm:items-center",
        className,
      )}
    >
      <span
        className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <LockKeyhole className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold">This track is locked</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {hint ??
            "Complete the previous module checkpoint to unlock the next learning track."}
        </p>
      </div>
      <Link
        href="/learn"
        className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All tracks
      </Link>
    </Card>
  );
}
