import type { ReactNode } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import {
  CONTEST_SPONSOR_TIER_CLASS,
  CONTEST_SPONSOR_TIER_LABEL,
  publicSponsorBadges,
  type ContestSponsorBadge,
  type ContestSponsorTier,
} from "@/lib/contest-ops";
import { cn, initials } from "@/lib/utils";

function externalHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function SponsorLogo({
  sponsor,
  size = "sm",
}: {
  sponsor: ContestSponsorBadge;
  size?: "sm" | "lg";
}) {
  const logoUrl = externalHttpUrl(sponsor.logoUrl);
  const box = size === "lg" ? "size-12 text-sm" : "size-9 text-[11px]";

  if (logoUrl) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background",
          box,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are arbitrary remote URLs, so next/image cannot be configured for them. */}
        <img
          src={logoUrl}
          alt=""
          width={size === "lg" ? 48 : 36}
          height={size === "lg" ? 48 : 36}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-lg border border-border bg-muted font-semibold uppercase text-muted-foreground",
        box,
      )}
    >
      {initials(sponsor.name)}
    </span>
  );
}

function SponsorTierChip({ tier }: { tier: ContestSponsorTier }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
        CONTEST_SPONSOR_TIER_CLASS[tier],
      )}
    >
      <Sparkles className="size-2.5" aria-hidden="true" />
      {CONTEST_SPONSOR_TIER_LABEL[tier]}
    </span>
  );
}

function SponsorShell({
  sponsor,
  className,
  children,
}: {
  sponsor: ContestSponsorBadge;
  className?: string;
  children: ReactNode;
}) {
  const href = externalHttpUrl(sponsor.websiteUrl);
  const linkClass = cn(
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  if (!href) return <div className={className}>{children}</div>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${sponsor.name} — ${CONTEST_SPONSOR_TIER_LABEL[sponsor.tier]} website (opens in a new tab)`}
      className={cn(linkClass, "transition-colors hover:border-primary/40")}
    >
      {children}
    </a>
  );
}

function TitleSponsorCard({ sponsor }: { sponsor: ContestSponsorBadge }) {
  const href = externalHttpUrl(sponsor.websiteUrl);

  return (
    <SponsorShell
      sponsor={sponsor}
      className="block rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700/70 dark:bg-amber-950/30"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <SponsorLogo sponsor={sponsor} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            Title sponsor
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-amber-950 dark:text-amber-50">
            {sponsor.name}
          </p>
          {sponsor.message ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">
              {sponsor.message}
            </p>
          ) : null}
        </div>
        {href ? (
          <ExternalLink
            className="size-4 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </SponsorShell>
  );
}

function PartnerSponsorCard({ sponsor }: { sponsor: ContestSponsorBadge }) {
  const href = externalHttpUrl(sponsor.websiteUrl);

  return (
    <SponsorShell
      sponsor={sponsor}
      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
    >
      <SponsorLogo sponsor={sponsor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{sponsor.name}</p>
        <span className="mt-0.5 flex">
          <SponsorTierChip tier={sponsor.tier} />
        </span>
      </div>
      {href ? (
        <ExternalLink
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
    </SponsorShell>
  );
}

export function ContestSponsorStrip({
  sponsors,
  heading = "Contest sponsors",
  className,
}: {
  sponsors: ContestSponsorBadge[];
  heading?: string;
  className?: string;
}) {
  const ordered = publicSponsorBadges(sponsors ?? []);
  if (ordered.length === 0) return null;

  const titleSponsor = ordered.find((sponsor) => sponsor.tier === "TITLE") ?? null;
  const partners = ordered.filter((sponsor) => sponsor.tier !== "TITLE");

  return (
    <section aria-label={heading} className={cn("space-y-2.5", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {heading}
      </h2>
      {titleSponsor ? <TitleSponsorCard sponsor={titleSponsor} /> : null}
      {partners.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {partners.map((sponsor) => (
            <li key={sponsor.id} className="min-w-0">
              <PartnerSponsorCard sponsor={sponsor} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
