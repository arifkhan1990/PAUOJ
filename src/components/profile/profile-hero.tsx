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
  UserPlus,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ReportButton } from "@/features/moderation/report-dialog";
import { FollowButton } from "@/components/profile/follow-button";
import { MessageButton } from "@/components/profile/message-button";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { ProfileBlockButton } from "@/components/profile/profile-block-button";
import { ProfileDetails } from "@/components/profile/profile-details";
import { ProfileShareButton } from "@/components/profile/profile-share-button";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FollowState } from "@/lib/follow-types";
import type { ProfileStats } from "@/lib/types";
import { getRatingTier } from "@/lib/rating-tiers";
import { cn, formatDate, formatPercent } from "@/lib/utils";

type HeroStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const compactAction = "h-11 gap-1.5 rounded-lg px-3 text-xs sm:h-9";

export function ProfileHero({ profile }: { profile: ProfileStats }) {
  const { user } = profile;
  const rated = profile.contestCount > 0;
  const tier = getRatingTier(user.rating, rated);
  const followersHref = `/users/${user.username}/connections?tab=followers`;
  const followingHref = `/users/${user.username}/connections?tab=following`;
  const followState: FollowState = {
    following: user.isFollowing,
    requested: user.requested,
    incomingRequest: user.incomingRequest,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    blocked: user.blocked,
    canMessage: user.canMessage,
  };

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

  const hasWork = Boolean(
    user.currentStatus ||
      user.companyName ||
      user.jobTitle ||
      user.skills.some((skill) => skill.trim()),
  );
  const hasLinks = Boolean(user.website || user.github || user.linkedin);
  const hasDetails = Boolean(user.bio || hasWork || hasLinks);
  const showBlock =
    !user.isSelf && (!user.blocked || user.blockedByViewer);

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <div
        className="hero-glow pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <UserAvatar
              name={user.displayName}
              username={user.username}
              size="xl"
              className="size-20 shrink-0 text-[28px] font-bold shadow-sm ring-4 sm:size-24"
              avatarPreset={user.avatarPreset}
              avatarImageAt={user.avatarImageUpdatedAt}
            />
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Coder profile
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {user.displayName}
                </h1>
                <PresenceIndicator presence={user.presence} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                    rated
                      ? tier.badgeClassName
                      : "border-dashed border-border bg-muted/40 text-muted-foreground",
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
              <p className="mt-0.5 font-mono text-xs text-muted-foreground sm:text-[13px]">
                @{user.username}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Joined {formatDate(user.createdAt)}
                </span>
                {user.country ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {user.country}
                  </span>
                ) : null}
                {user.institution ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-3.5" aria-hidden="true" />
                    {user.institution}
                  </span>
                ) : null}
                <Link
                  href={followersHref}
                  className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <UsersRound className="size-3.5" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {user.followerCount.toLocaleString("en-US")}
                    </span>{" "}
                    {user.followerCount === 1 ? "follower" : "followers"}
                  </span>
                </Link>
                <Link
                  href={followingHref}
                  className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <UserRoundPlus className="size-3.5" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {user.followingCount.toLocaleString("en-US")}
                    </span>{" "}
                    following
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {user.isSelf ? (
              <Link
                href="/settings"
                className={cn(buttonVariants({ variant: "outline" }), compactAction)}
              >
                <Settings className="size-4" aria-hidden="true" /> Edit profile
              </Link>
            ) : user.blocked ? (
              user.blockedByViewer ? null : (
                <span className="inline-flex h-11 items-center rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-muted-foreground sm:h-9">
                  Unavailable
                </span>
              )
            ) : user.canFollow ? (
              <>
                <FollowButton
                  username={user.username}
                  initialState={followState}
                  compact
                />
                {user.canMessage ? (
                  <MessageButton username={user.username} compact />
                ) : null}
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(`/users/${user.username}`)}`}
                className={cn(buttonVariants({ variant: "outline" }), compactAction)}
              >
                <UserPlus className="size-4" aria-hidden="true" /> Sign in to
                follow
              </Link>
            )}

            <div
              className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-background/50 p-0.5"
              role="group"
              aria-label="Secondary profile actions"
            >
              <ProfileShareButton
                username={user.username}
                displayName={user.displayName}
                iconOnly
              />
              {showBlock ? (
                <>
                  <span
                    className="mx-0.5 h-4 w-px bg-border"
                    aria-hidden="true"
                  />
                  <ProfileBlockButton
                    username={user.username}
                    blockedByViewer={user.blockedByViewer}
                    iconOnly
                  />
                </>
              ) : null}
              {!user.isSelf ? (
                <ReportButton
                  kind="PROFILE"
                  username={user.username}
                  iconOnly
                  ariaLabel={`Report @${user.username}`}
                  className="h-11 w-11 rounded-lg px-0 text-muted-foreground hover:text-destructive sm:h-9 sm:min-h-9 sm:w-9"
                />
              ) : null}
            </div>
          </div>
        </div>

        {hasDetails ? (
          <div className="mt-5 border-t border-border/60 pt-4">
            {user.bio ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {user.bio}
              </p>
            ) : null}
            <ProfileDetails
              status={user.currentStatus}
              companyName={user.companyName}
              jobTitle={user.jobTitle}
              skills={user.skills}
            />
            <ProfileSocialLinks
              website={user.website}
              github={user.github}
              linkedin={user.linkedin}
            />
          </div>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 backdrop-blur-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="text-lg font-semibold leading-tight tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </Card>
  );
}
