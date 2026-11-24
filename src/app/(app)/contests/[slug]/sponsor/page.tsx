import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ContestFormatBadge } from "@/components/contests/contest-format-badge";
import { ContestSponsorStrip } from "@/components/contests/contest-sponsor-strip";
import { ContestStatusBadge } from "@/components/contests/contest-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SponsorRequestForm } from "@/features/contests/sponsor-request-form";
import { getCurrentUser } from "@/server/auth/session";
import { getContestBySlug } from "@/server/services/contests";
import { CONTEST_DIVISION_LABEL } from "@/lib/contests";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Sponsor · ${slug}` };
}

export default async function ContestSponsorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/contests/${slug}/sponsor`)}`,
    );
  }

  const contest = await getContestBySlug(slug, user.id, user.role === "ADMIN");
  if (!contest) notFound();

  const format = contest.format ?? "SINGLE";
  const sponsors = contest.sponsors ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Partnership"
        title="Sponsor this contest"
        description={`Put your name in front of every participant in ${contest.title}. Approved sponsors are highlighted on the contest page and the standings.`}
        actions={
          <Link
            href={`/contests/${contest.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to contest
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ContestStatusBadge status={contest.status} />
        <ContestFormatBadge format={format} teamSize={contest.teamSize} />
        <span className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {CONTEST_DIVISION_LABEL[contest.division]}
        </span>
      </div>

      {sponsors.length > 0 ? (
        <ContestSponsorStrip
          sponsors={sponsors}
          heading="Current partners"
          className="mt-6"
        />
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <SponsorRequestForm slug={contest.slug} />
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
              How sponsorship works
            </h2>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>1. Send the request with your tier and public links.</li>
              <li>2. The contest team reviews it before the round.</li>
              <li>
                3. Approved sponsors are highlighted on the contest page; title
                sponsors get the hero strip.
              </li>
            </ol>
          </Card>

          {sponsors.length === 0 ? (
            <EmptyState
              title="No partners yet"
              description="Be the first sponsor highlighted on this round."
              icon={BadgeCheck}
            />
          ) : null}

          <Card className="p-4">
            <h2 className="text-sm font-semibold">Host instead?</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Bring your own contest to PAU OJ with a fresh problem set and a
              private director workspace.
            </p>
            <Link
              href="/contests/host"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-3 h-11 w-full",
              )}
            >
              Host a contest
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
