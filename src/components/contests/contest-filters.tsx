import Link from "next/link";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  CONTEST_DIVISION_LABEL,
  contestListHref,
  type ContestListStatusFilter,
} from "@/lib/contests";
import { CONTEST_FORMAT_LABEL, type ContestFormat } from "@/lib/contest-ops";
import type { ContestDivision } from "@/lib/types";
import { cn } from "@/lib/utils";

const countFormatter = new Intl.NumberFormat("en-US");

const STATUS_FILTERS: { value: ContestListStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "RUNNING", label: "Live" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ENDED", label: "Ended" },
];

const FORMAT_FILTERS: { value?: ContestFormat; label: string }[] = [
  { label: "All" },
  { value: "SINGLE", label: "Solo" },
  { value: "GROUP", label: "Team" },
];

const DIVISION_FILTERS: ContestDivision[] = [
  "OPEN",
  "DIV1",
  "DIV2",
  "DIV3",
  "DIV4",
];

const filterLinkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

function StatusLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-md px-1 text-[11px] whitespace-nowrap transition-colors sm:gap-1.5 sm:px-3 sm:text-sm",
        filterLinkFocus,
        active
          ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border"
          : "font-medium text-muted-foreground hover:bg-card/70 hover:text-foreground",
      )}
    >
      <span className="flex min-w-0 flex-col items-center justify-center gap-0 sm:flex-row sm:gap-1.5">
        <span className="max-w-full truncate">{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            "font-mono text-[10px] tabular-nums sm:text-xs",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {countFormatter.format(count)}
        </span>
      </span>
    </Link>
  );
}

function SegmentLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-md px-1 text-[11px] font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3 sm:text-xs",
        filterLinkFocus,
        active
          ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border"
          : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function SegmentGroup({
  label,
  columns,
  children,
}: {
  label: string;
  columns: 3 | 6;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={`${label} filter`}
      className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:w-16 sm:shrink-0">
        {label}
      </span>
      <div
        className={cn(
          "grid gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5 sm:inline-flex sm:w-auto",
          columns === 3 ? "grid-cols-3" : "grid-cols-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ContestFilters({
  filter,
  division,
  format,
  hasFilters,
  counts,
}: {
  filter: ContestListStatusFilter;
  division?: ContestDivision;
  format?: ContestFormat;
  hasFilters: boolean;
  counts: Record<ContestListStatusFilter, number>;
}) {
  return (
    <section
      aria-label="Contest filters"
      className="rounded-xl border border-border bg-card p-2"
    >
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Filter contests by status"
          className="flex min-w-0 flex-1 items-stretch gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
        >
          {STATUS_FILTERS.map((item) => (
            <StatusLink
              key={item.value}
              href={contestListHref({
                filter: item.value,
                division,
                format,
              })}
              active={filter === item.value}
              label={item.label}
              count={counts[item.value]}
            />
          ))}
        </div>

        {hasFilters ? (
          <Link
            href="/contests"
            aria-label="Clear filters"
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              filterLinkFocus,
            )}
          >
            <X className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Clear filters</span>
            <span className="sm:hidden">Clear</span>
          </Link>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2 lg:flex-row lg:items-center lg:gap-5">
        <SegmentGroup label="Format" columns={3}>
          {FORMAT_FILTERS.map((item) => (
            <SegmentLink
              key={item.label}
              href={contestListHref({ filter, division, format: item.value })}
              active={format === item.value}
            >
              {item.value ? CONTEST_FORMAT_LABEL[item.value] : item.label}
            </SegmentLink>
          ))}
        </SegmentGroup>

        <span
          aria-hidden="true"
          className="hidden h-8 w-px shrink-0 bg-border lg:block"
        />

        <SegmentGroup label="Division" columns={6}>
          <SegmentLink
            href={contestListHref({ filter, format })}
            active={!division}
          >
            All
          </SegmentLink>
          {DIVISION_FILTERS.map((value) => (
            <SegmentLink
              key={value}
              href={contestListHref({ filter, division: value, format })}
              active={division === value}
            >
              {CONTEST_DIVISION_LABEL[value]}
            </SegmentLink>
          ))}
        </SegmentGroup>
      </div>
    </section>
  );
}
