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

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm">
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <UserAvatar
              name={user.displayName}
              username={user.username}
              size="xl"
              className="size-20 text-[26px] font-bold ring-0"
              avatarPreset={user.avatarPreset}
              avatarImageAt={user.avatarImageUpdatedAt}
            />
            <div className="min-w-0 pt-0.5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Coder profile
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.displayName}
                </h1>
                <PresenceIndicator presence={user.presence} />
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
                <Link
                  href={followersHref}
                  className="-my-1 inline-flex items-center rounded-sm py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {user.followerCount.toLocaleString("en-US")}{" "}
                  {user.followerCount === 1 ? "follower" : "followers"}
                </Link>
                <Link
                  href={followingHref}
                  className="-my-1 inline-flex items-center rounded-sm py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {user.followingCount.toLocaleString("en-US")} following
                </Link>
              </div>
              {user.bio ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {user.isSelf ? (
              <Link
                href="/settings"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 gap-1.5 rounded-lg px-3.5 text-sm",
                )}
              >
                <Settings className="size-4" aria-hidden="true" /> Edit profile
              </Link>
            ) : user.blocked ? (
              user.blockedByViewer ? (
                <ProfileBlockButton username={user.username} blockedByViewer />
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-lg border border-border bg-muted/40 px-3.5 text-xs font-medium text-muted-foreground">
                  Unavailable
                </span>
              )
            ) : user.canFollow ? (
              <>
                <FollowButton
                  username={user.username}
                  initialState={followState}
                />
                {user.canMessage ? (
                  <MessageButton username={user.username} />
                ) : null}
                <ProfileBlockButton
                  username={user.username}
                  blockedByViewer={false}
                />
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(`/users/${user.username}`)}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 gap-1.5 rounded-lg px-3.5 text-sm",
                )}
              >
                <UserPlus className="size-4" aria-hidden="true" /> Sign in to
                follow
              </Link>
            )}
            <ProfileShareButton
              username={user.username}
              displayName={user.displayName}
            />
            {!user.isSelf ? (
              <ReportButton kind="PROFILE" username={user.username} />
            ) : null}
          </div>
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
