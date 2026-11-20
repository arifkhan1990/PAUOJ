"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function ProblemFormFooter({
  dirty,
  loading,
  basePath = "/admin/problems",
}: {
  dirty: boolean;
  loading: boolean;
  basePath?: string;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="text-xs text-muted-foreground">
        {dirty ? "Unsaved changes" : "No unsaved changes"}
      </p>
      <div className="flex gap-2">
        <Link
          href={basePath}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {loading ? "Saving…" : "Save problem"}
        </Button>
      </div>
    </div>
  );
}
