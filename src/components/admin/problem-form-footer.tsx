import Link from "next/link";
import { Loader2, LockKeyhole, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function ProblemFormFooter({
  dirty,
  loading,
  locked = false,
  lockedReason,
  basePath = "/admin/problems",
}: {
  dirty: boolean;
  loading: boolean;
  locked?: boolean;
  lockedReason?: string;
  basePath?: string;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {locked ? (
          <>
            <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
            {lockedReason ?? "This problem is locked."}
          </>
        ) : dirty ? (
          "Unsaved changes"
        ) : (
          "No unsaved changes"
        )}
      </p>
      <div className="flex gap-2">
        <Link
          href={basePath}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={loading || locked}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : locked ? (
            <LockKeyhole className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {loading ? "Saving…" : locked ? "Locked" : "Save problem"}
        </Button>
      </div>
    </div>
  );
}
