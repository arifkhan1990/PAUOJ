import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  CONTEST_STAFF_ROLE_LABEL,
  isContestStaffRole,
  type ContestStaffRole,
} from "@/lib/contest-ops";
import { getLearningModule } from "@/lib/learning/modules";
import { modulePriceBdt } from "@/lib/learning/payments";
import type { LockedProblem } from "./locked-problem";

/** Distinct crew 403 state: sealed statements for the crew while running. */
function CrewLockedView({ locked }: { locked: LockedProblem }) {
  const crewRole = locked.role ?? "";
  const roleLabel = isContestStaffRole(crewRole)
    ? CONTEST_STAFF_ROLE_LABEL[crewRole as ContestStaffRole]
    : "contest crew";
  return (
    <EmptyState
      title="Contest crew access blocked"
      description={`You are on the ${roleLabel.toLowerCase()} crew for "${locked.title}". Problem statements stay sealed for the crew while the round is running, and crew members cannot compete. The statement opens here after the contest ends.`}
      icon={ShieldAlert}
      action={
        <Link href={`/contests/${locked.slug}`} className={buttonVariants()}>
          Open contest
        </Link>
      }
    />
  );
}

function ContextLockedView({
  locked,
  isSignedIn,
}: {
  locked: LockedProblem;
  isSignedIn: boolean;
}) {
  const premiumModule =
    locked.kind === "premium" && locked.moduleSlug
      ? getLearningModule(locked.moduleSlug)
      : null;
  const premiumTitle =
    premiumModule?.title.split(" · ")[0] ?? "premium module";
  const premiumPrice =
    locked.kind === "premium" && locked.moduleSlug
      ? (modulePriceBdt(locked.moduleSlug) ?? 500)
      : 500;

  return (
    <EmptyState
      title="This problem is locked"
      description={
        locked.kind === "assessment"
          ? `It is part of the running coding assessment "${locked.title}". Open the assessment and join with your access code.`
          : locked.kind === "premium"
            ? `"${locked.title}" is part of the ${premiumTitle} track. Unlock it once for ৳${premiumPrice} to open the statement, editorial and submissions.`
            : `It is part of the running contest "${locked.title}". Register for the contest to open the statement and submit.`
      }
      icon={LockKeyhole}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href={
              locked.kind === "assessment"
                ? `/assessments/${locked.slug}`
                : locked.kind === "premium"
                  ? "/learn/pricing"
                  : `/contests/${locked.slug}`
            }
            className={buttonVariants()}
          >
            {locked.kind === "assessment"
              ? "Open assessment"
              : locked.kind === "premium"
                ? `Unlock ${premiumTitle} · ৳${premiumPrice}`
                : "Open contest"}
          </Link>
          {locked.kind === "premium" ? (
            <Link
              href={`/learn/${locked.moduleSlug ?? "advanced-sql"}`}
              className={buttonVariants({ variant: "outline" })}
            >
              See the track
            </Link>
          ) : !isSignedIn ? (
            <Link
              href={`/login?next=${encodeURIComponent(
                locked.kind === "assessment"
                  ? `/assessments/${locked.slug}`
                  : `/contests/${locked.slug}`,
              )}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Sign in first
            </Link>
          ) : null}
        </div>
      }
    />
  );
}

export function LockedProblemView({
  locked,
  isSignedIn,
}: {
  locked: LockedProblem;
  isSignedIn: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {locked.kind === "crew" ? (
        <CrewLockedView locked={locked} />
      ) : (
        <ContextLockedView locked={locked} isSignedIn={isSignedIn} />
      )}
    </div>
  );
}
