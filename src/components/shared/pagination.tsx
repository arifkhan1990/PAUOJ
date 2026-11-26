import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { pageHref, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export function paginationRange(
  page: number,
  totalPages: number,
): (number | "dots")[] {
  const wanted = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);
  const result: (number | "dots")[] = [];
  let previous = 0;
  for (const value of pages) {
    if (previous > 0 && value - previous > 1) result.push("dots");
    result.push(value);
    previous = value;
  }
  return result;
}

export function Pagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: {
  pathname: string;
  searchParams: SearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 pt-6"
      aria-label="Pagination"
    >
      <Link
        href={pageHref(pathname, searchParams, Math.max(1, page - 1))}
        prefetch={false}
        aria-disabled={page <= 1}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Link>
      {paginationRange(page, totalPages).map((value, index) =>
        value === "dots" ? (
          <span
            key={`dots-${index}`}
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={value}
            href={pageHref(pathname, searchParams, value)}
            prefetch={false}
            aria-current={value === page ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: value === page ? "default" : "outline",
                size: "icon",
              }),
              "tabular-nums",
            )}
          >
            {value}
          </Link>
        ),
      )}
      <Link
        href={pageHref(pathname, searchParams, Math.min(totalPages, page + 1))}
        prefetch={false}
        aria-disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
