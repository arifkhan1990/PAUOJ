import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { paginationRange } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { buildQueryString, type SearchParams } from "@/lib/pagination";
import {
  RANK_PAGE_SIZES,
  rankResultRange,
  type RankPageSize,
} from "@/lib/rank-filters";
import { cn } from "@/lib/utils";

function NavControl({
  href,
  label,
  disabled,
  children,
}: {
  href: string;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={label}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-11 cursor-not-allowed opacity-40",
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "size-11",
      )}
    >
      {children}
    </Link>
  );
}

export function RankPagination({
  searchParams,
  page,
  pageSize,
  total,
}: {
  searchParams: SearchParams;
  page: number;
  pageSize: RankPageSize;
  total: number;
}) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { from, to } = rankResultRange(page, pageSize, total);

  const pageHref = (nextPage: number) => {
    const query = buildQueryString(searchParams, { page: nextPage });
    return query ? `/rank?${query}` : "/rank";
  };
  const sizeHref = (size: number) => {
    const query = buildQueryString(searchParams, {
      pageSize: size,
      page: 1,
    });
    return query ? `/rank?${query}` : "/rank";
  };

  return (
    <nav
      aria-label="Ranking pagination"
      className="mt-6 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium tabular-nums text-foreground">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-foreground">
          {total}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="group"
          aria-label="Rows per page"
          className="flex items-center gap-1.5"
        >
          <span className="text-xs text-muted-foreground">Rows</span>
          {RANK_PAGE_SIZES.map((size) =>
            size === pageSize ? (
              <span
                key={size}
                aria-current="true"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "h-11 min-w-11 px-2.5 tabular-nums",
                )}
              >
                {size}
              </span>
            ) : (
              <Link
                key={size}
                href={sizeHref(size)}
                aria-label={`Show ${size} rows per page`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-11 min-w-11 px-2.5 tabular-nums",
                )}
              >
                {size}
              </Link>
            ),
          )}
        </div>

        <div
          role="group"
          aria-label="Pages"
          className="flex flex-wrap items-center gap-1"
        >
          <NavControl
            href={pageHref(1)}
            label="First page"
            disabled={page <= 1}
          >
            <ChevronsLeft aria-hidden="true" className="size-4" />
          </NavControl>
          <NavControl
            href={pageHref(Math.max(1, page - 1))}
            label="Previous page"
            disabled={page <= 1}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </NavControl>

          {paginationRange(page, totalPages).map((value, index) =>
            value === "dots" ? (
              <span
                key={`dots-${index}`}
                aria-hidden="true"
                className="px-0.5 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : value === page ? (
              <span
                key={value}
                aria-current="page"
                aria-label={`Page ${value}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "icon" }),
                  "size-11 tabular-nums",
                )}
              >
                {value}
              </span>
            ) : (
              <Link
                key={value}
                href={pageHref(value)}
                aria-label={`Page ${value}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "size-11 tabular-nums",
                )}
              >
                {value}
              </Link>
            ),
          )}

          <NavControl
            href={pageHref(Math.min(totalPages, page + 1))}
            label="Next page"
            disabled={page >= totalPages}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </NavControl>
          <NavControl
            href={pageHref(totalPages)}
            label="Last page"
            disabled={page >= totalPages}
          >
            <ChevronsRight aria-hidden="true" className="size-4" />
          </NavControl>
        </div>
      </div>
    </nav>
  );
}
