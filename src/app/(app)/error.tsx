"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page could not be loaded. This is usually temporary. Try again, or
        go back to a safe page.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
