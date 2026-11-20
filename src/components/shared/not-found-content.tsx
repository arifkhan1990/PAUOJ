import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </span>
      <p className="mt-5 font-mono text-xs text-primary">404</p>
      <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you are looking for does not exist, was moved, or is hidden by
        contest rules.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/problems" className={buttonVariants()}>
          Browse problems
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
