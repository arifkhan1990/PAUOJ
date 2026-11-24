import Link from "next/link";
import { Trophy, UsersRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ContestTeamEntryButton } from "@/components/contests/contest-team-entry-button";
import { ContestRegisterButton } from "@/features/contests/contest-register-button";
import { VirtualContestButton } from "@/features/contests/virtual-contest-button";
import { CONTEST_TEAM_MAX_SIZE } from "@/lib/contest-ops";
import type { ContestDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The hero banner is always dark (custom image overlay or branded teal), so the
 * primary action uses a high-contrast white surface instead of the teal token.
 */
const heroPrimaryClass = cn(
  buttonVariants({ size: "lg" }),
  "h-11 w-full justify-center gap-2 border border-white/25 bg-white text-[#04231f] shadow-lg hover:bg-white/90 hover:text-[#04231f] sm:w-auto",
);

const heroGhostClass = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "h-11 w-full gap-2 border-white/25 bg-white/10 text-white shadow-sm hover:bg-white/20 hover:text-white sm:w-auto",
);

/**
 * One primary path per contest state. Crew members never get a CTA (the crew
 * notice below the hero explains why), and group rounds send viewers to the
 * team panel that sits directly under the hero.
 */
export function ContestHeroActions({
  contest,
  isAuthenticated,
  isStaff,
}: {
  contest: ContestDetail;
  isAuthenticated: boolean;
  isStaff: boolean;
}) {
  if (isStaff) return null;

  const isGroup = (contest.format ?? "SINGLE") === "GROUP";

  if (isGroup) {
    if (contest.status === "ENDED") {
      return (
        <Link
          href={`/contests/${contest.slug}/standings`}
          className={heroPrimaryClass}
        >
          <Trophy className="size-4" aria-hidden="true" />
          Final standings
        </Link>
      );
    }
    if (contest.status === "RUNNING") {
      if (contest.viewerTeam) {
        return (
          <Link href="#team" className={heroPrimaryClass}>
            <UsersRound className="size-4" aria-hidden="true" />
            View your team
          </Link>
        );
      }
      return (
        <Link
          href={`/contests/${contest.slug}/standings`}
          className={heroPrimaryClass}
        >
          <Trophy className="size-4" aria-hidden="true" />
          Live standings
        </Link>
      );
    }
    if (contest.viewerTeam || contest.incomingTeamInvite || !isAuthenticated) {
      return (
        <Link href="#team" className={heroPrimaryClass}>
          <UsersRound className="size-4" aria-hidden="true" />
          {contest.viewerTeam
            ? "Manage your team"
            : contest.incomingTeamInvite
              ? "Review team invitation"
              : "Create or join a team"}
        </Link>
      );
    }

    if (contest.canCreateTeam || contest.canJoinTeam) {
      return (
        <ContestTeamEntryButton
          slug={contest.slug}
          maxMembers={contest.teamSize || CONTEST_TEAM_MAX_SIZE}
          canCreate={contest.canCreateTeam}
          canJoin={contest.canJoinTeam}
          className={heroPrimaryClass}
        />
      );
    }

    return (
      <Link href="#team" className={heroPrimaryClass}>
        <UsersRound className="size-4" aria-hidden="true" />
        Create or join a team
      </Link>
    );
  }

  if (contest.status === "ENDED") {
    if (!isAuthenticated) return null;
    return (
      <VirtualContestButton
        slug={contest.slug}
        label="Start a virtual contest"
        className={heroGhostClass}
      />
    );
  }

  return (
    <ContestRegisterButton
      slug={contest.slug}
      registered={contest.registered}
      canRegister={contest.canRegister}
      isAuthenticated={isAuthenticated}
      ended={false}
      size="lg"
      className={
        contest.registered
          ? "h-11 justify-center px-4"
          : heroPrimaryClass
      }
    />
  );
}
