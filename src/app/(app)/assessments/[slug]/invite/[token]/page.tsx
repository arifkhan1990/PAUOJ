import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Ban,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MailCheck,
  TimerOff,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { AssessmentInviteClaimForm } from "@/features/assessments/assessment-invite-claim-form";
import { InviteTokenMemory } from "@/features/assessments/invite-token-memory";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/session";
import { resolveInviteToken } from "@/server/services/assessment-invites";
import { assessmentPhase } from "@/lib/assessments";
import { refHint } from "@/lib/assessment-invites";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Absolute so the root `%s · PAU OJ` template does not repeat the app name.
  title: { absolute: "Assessment invite · PAU OJ" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Notice({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-1 space-y-2 text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function AssessmentInvitePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const resolved = await resolveInviteToken(token);
  if (
    !resolved ||
    resolved.assessment.slug !== slug ||
    !resolved.assessment.isPublished
  ) {
    notFound();
  }

  const { invite, assessment, status } = resolved;
  const user = await getCurrentUser();
  const phase = assessmentPhase(assessment.startAt, assessment.endAt);
  const requiresRef = !invite.email;
  const hint = refHint(invite.candidateRef);
  const claimedByMe = Boolean(user && invite.claimedByUserId === user.id);
  const returnPath = `/assessments/${slug}/invite`;

  const signIn = (
    <Notice icon={LockKeyhole} title="Sign in to continue">
      <p>Sign in and we will bring you back to this invite.</p>
      <Link
        href={`/login?next=${encodeURIComponent(returnPath)}`}
        className={`${buttonVariants()} mt-1 w-full`}
      >
        Sign in to continue
      </Link>
    </Notice>
  );

  let body: React.ReactNode;
  if (status === "REVOKED") {
    body = (
      <Notice icon={Ban} title="Invite revoked">
        <p>This invite was revoked. Ask your instructor for a new link.</p>
      </Notice>
    );
  } else if (status === "EXPIRED" || phase === "ENDED") {
    body = (
      <Notice icon={TimerOff} title="Invite expired">
        <p>This invite has expired.</p>
      </Notice>
    );
  } else if (status === "CLAIMED" && claimedByMe) {
    body = (
      <div className="space-y-4">
        <Notice icon={CheckCircle2} title="Invite already claimed">
          <p>You have already claimed this invite.</p>
          <p>
            Resuming keeps your original timer; it does not restart or extend
            it.
          </p>
        </Notice>
        <AssessmentInviteClaimForm
          slug={slug}
          token={token}
          requiresRef={requiresRef}
          refHint={hint}
          resume
        />
      </div>
    );
  } else if (status === "CLAIMED" && !user) {
    body = signIn;
  } else if (status === "CLAIMED") {
    body = (
      <Notice icon={CheckCircle2} title="Invite already used">
        <p>This invite has already been used.</p>
      </Notice>
    );
  } else if (phase === "UPCOMING") {
    body = (
      <Notice icon={CalendarClock} title="Assessment not open yet">
        <p>
          This assessment opens {formatDateTime(assessment.startAt)}. The timer
          starts only when you press Start.
        </p>
      </Notice>
    );
  } else if (!user) {
    body = signIn;
  } else {
    body = (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Start your assessment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start when you are ready. This invite is tied to the account that
            received it.
          </p>
        </div>
        <AssessmentInviteClaimForm
          slug={slug}
          token={token}
          requiresRef={requiresRef}
          refHint={hint}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <InviteTokenMemory slug={slug} token={token} />
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <MailCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assessment invite
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight">
              {assessment.title}
            </h1>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
          <span className="inline-flex items-start gap-1.5">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
            <span className="break-words">
              {formatDateTime(assessment.startAt)} —{" "}
              {formatDateTime(assessment.endAt)}
            </span>
          </span>
          <span className="inline-flex items-start gap-1.5">
            <Clock3 className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {assessment.durationMinutes
                ? `${assessment.durationMinutes} minute session`
                : "Whole window"}
            </span>
          </span>
          {invite.candidateName ? (
            <span className="inline-flex items-start gap-1.5">
              <UserCheck className="mt-0.5 size-3.5 shrink-0" />
              <span className="break-words">{invite.candidateName}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border pt-5">{body}</div>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        This link is personal to you. Do not forward it.
      </p>
    </div>
  );
}
