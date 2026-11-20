import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Gem,
  MapPin,
  Medal,
  Settings,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfileStats } from "@/lib/types";
import { getRatingTier } from "@/lib/rating-tiers";
import { cn, formatDate, formatPercent } from "@/lib/utils";

type HeroStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function ProfileHero({ profile }: { profile: ProfileStats }) {
  const { user } = profile;
  const rated = profile.contestCount > 0;
  const tier = getRatingTier(user.rating, rated);

  const stats: HeroStat[] = [
    {
      label: "Points",
      value: profile.points.toLocaleString("en-US"),
      icon: Trophy,
    },
    {
      label: "Rank",
      value: profile.rank ? `#${profile.rank}` : "—",
      icon: Medal,
    },
    {
      label: "Solved",
      value: profile.solvedCount.toLocaleString("en-US"),
      icon: CheckCircle2,
    },
    {
      label: "Acceptance",
      value: formatPercent(profile.acceptanceRate),
      icon: Target,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm">
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <UserAvatar
              name={user.displayName}
              username={user.username}
              size="xl"
              className="size-20 bg-orange-500 text-[26px] font-bold ring-0"
            />
            <div className="min-w-0 pt-0.5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Coder profile
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.displayName}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    rated
                      ? tier.badgeClassName
                      : "border-border bg-muted/40 text-muted-foreground",
                  )}
                  title={
                    rated
                      ? `${tier.label} tier`
                      : "Finish a rated contest to enter the rating ladder"
                  }
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      rated ? tier.barClassName : "bg-muted-foreground/50",
                    )}
                  />
                  <Gem className="size-3 opacity-70" aria-hidden="true" />
                  {tier.label}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">
                @{user.username}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> Joined{" "}
                  {formatDate(user.createdAt)}
                </span>
                {user.country ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden="true" />{" "}
                    {user.country}
                  </span>
                ) : null}
                {user.institution ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-3.5" aria-hidden="true" />{" "}
                    {user.institution}
                  </span>
                ) : null}
              </div>
              {user.bio ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {user.bio}
                </p>
              ) : null}
            </div>
          </div>
          {user.isSelf ? (
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 shrink-0 gap-1.5 rounded-lg px-3 text-[13px]",
              )}
            >
              <Settings className="size-3.5" aria-hidden="true" /> Edit profile
            </Link>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="min-h-20 bg-card px-4 py-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-xl font-bold leading-none tabular-nums">
                  {stat.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </Card>
  );
}
