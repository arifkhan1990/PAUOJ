"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  MailPlus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { contestTeamInviteSchema } from "@/lib/schemas/contest-ops";
import type {
  ContestTeamInviteView,
  ContestTeamView,
} from "@/lib/contest-ops";
import { cn, formatDate } from "@/lib/utils";

function teamsApiPath(slug: string): string {
  return `/api/v1/contests/${encodeURIComponent(slug)}/teams`;
}

function invitesApiPath(slug: string): string {
  return `${teamsApiPath(slug)}/invites`;
}

function inviteApiPath(slug: string, inviteId: string): string {
  return `${invitesApiPath(slug)}/${encodeURIComponent(inviteId)}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function InviteError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="text-[11px] font-medium text-rose-600 dark:text-rose-400"
    >
      {message}
    </p>
  );
}

/**
 * Prominent invitation card shown to a signed-in coder who has no team yet.
 * Accepting registers the coder through the existing team flow.
 */
export function IncomingTeamInviteCard({
  slug,
  invite,
  closed,
}: {
  slug: string;
  invite: ContestTeamInviteView;
  closed: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = async (action: "ACCEPT" | "DECLINE") => {
    setBusy(action);
    setError(null);
    try {
      await apiPatch(inviteApiPath(slug, invite.id), { action });
      if (action === "ACCEPT") {
        toast({
          title: `You joined ${invite.teamName}`,
          description: "You are registered for this contest.",
          variant: "success",
        });
      } else {
        toast({
          title: "Invitation declined",
          description: `You declined the invite from ${invite.teamName}.`,
          variant: "info",
        });
      }
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught, "Could not respond to the invitation.");
      setError(message);
      toast({
        title: "Invitation not updated",
        description: message,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <MailPlus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Team invitation
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold">
            {invite.teamName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {invite.invitedBy.displayName}
            </span>{" "}
            (@{invite.invitedBy.username}) invited you ·{" "}
            {formatDate(invite.createdAt)}
          </p>
        </div>
      </div>

      {closed ? (
        <p className="mt-3 rounded-md border border-border bg-background/70 p-3 text-xs leading-relaxed text-muted-foreground">
          Team formation closed when the round started, so this invitation can
          no longer be accepted.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-11 w-full sm:w-auto"
            disabled={busy !== null}
            onClick={() => void respond("ACCEPT")}
            aria-label={`Accept invitation to ${invite.teamName}`}
          >
            {busy === "ACCEPT" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            Accept invitation
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            disabled={busy !== null}
            onClick={() => void respond("DECLINE")}
            aria-label={`Decline invitation to ${invite.teamName}`}
          >
            {busy === "DECLINE" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="size-4" aria-hidden="true" />
            )}
            Decline
          </Button>
        </div>
      )}
      <InviteError id="incoming-invite-error" message={error} />
    </Card>
  );
}

/**
 * Captain-only invitation manager: invite by username (primary path) and
 * cancel pending invitations. The invite code stays available as a fallback.
 */
export function ContestTeamInvitePanel({
  slug,
  team,
  limit,
  active,
}: {
  slug: string;
  team: ContestTeamView;
  limit: number;
  active: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = team.pendingInvites ?? [];
  const full = team.members.length >= limit;

  if (!team.isViewerCaptain) return null;

  const sendInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = contestTeamInviteSchema.safeParse({ username });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a username.");
      return;
    }
    setBusy("invite");
    try {
      await apiPost(invitesApiPath(slug), parsed.data);
      setUsername("");
      toast({
        title: "Invitation sent",
        description: `We sent @${parsed.data.username} an in-app invitation.`,
        variant: "success",
      });
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught, "Could not send the invitation.");
      setError(message);
      toast({
        title: "Invitation not sent",
        description: message,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const cancelInvite = async (invite: ContestTeamInviteView) => {
    setBusy(`cancel-${invite.id}`);
    setCancelError(null);
    try {
      await apiDelete(inviteApiPath(slug, invite.id));
      toast({
        title: "Invitation cancelled",
        description: `@${invite.invitedUser.username} can no longer accept.`,
        variant: "success",
      });
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught, "Please try again.");
      setCancelError(message);
      toast({
        title: "Could not cancel the invitation",
        description: message,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-border bg-muted/25 p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <UserPlus className="size-4 text-primary" aria-hidden="true" />
        Invite a teammate
      </h3>

      {!active ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This team is not accepting new members right now. Invitations close
          when the round starts.
        </p>
      ) : full ? (
        <p className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-2 text-xs text-muted-foreground">
          <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          Team full · {team.members.length} of {limit} coders.
        </p>
      ) : (
        <form
          onSubmit={(event) => void sendInvite(event)}
          className="mt-2 space-y-1.5"
        >
          <Label htmlFor="contest-team-invite-username">Username</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="contest-team-invite-username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (error) setError(null);
              }}
              minLength={2}
              maxLength={80}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="e.g. nafisa"
              className="h-11 w-full shrink-0 sm:flex-1"
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error
                  ? "contest-team-invite-error contest-team-invite-hint"
                  : "contest-team-invite-hint"
              }
            />
            <Button
              type="submit"
              className="h-11 shrink-0"
              disabled={busy !== null}
            >
              {busy === "invite" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              Send invite
            </Button>
          </div>
          <p
            id="contest-team-invite-hint"
            className="text-[11px] leading-relaxed text-muted-foreground"
          >
            Enter the exact PAU OJ username. Invitations appear on their contest
            page before the round starts.
          </p>
          <InviteError id="contest-team-invite-error" message={error} />
        </form>
      )}

      {pending.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Pending invitations
          </p>
          <ul aria-label="Pending team invitations" className="mt-1.5 space-y-1.5">
            {pending.map((invite) => {
              const cancelling = busy === `cancel-${invite.id}`;
              return (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-medium">
                      {invite.invitedUser.displayName}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      @{invite.invitedUser.username}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 shrink-0 px-3 text-xs"
                    disabled={busy !== null}
                    onClick={() => void cancelInvite(invite)}
                    aria-label={`Cancel invitation for ${invite.invitedUser.username}`}
                  >
                    {cancelling ? (
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <X className="size-3.5" aria-hidden="true" />
                    )}
                    Cancel
                  </Button>
                </li>
              );
            })}
          </ul>
          <InviteError id="contest-team-cancel-error" message={cancelError} />
        </div>
      ) : null}
    </div>
  );
}

/** Signed-out state for team rounds; keeps the panel file focused on flows. */
export function ContestTeamSignedOutCard({
  slug,
  maxMembers,
}: {
  slug: string;
  maxMembers: number;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <UsersRound
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="min-w-0 text-sm text-muted-foreground">
          Team rounds need a team of {maxMembers}. Sign in to create one, accept an
          invitation or join with a code.
        </p>
      </div>
      <Link
        href={`/login?next=${encodeURIComponent(`/contests/${slug}`)}`}
        className={cn(buttonVariants(), "h-11 w-full shrink-0 justify-center sm:w-auto")}
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Sign in
      </Link>
    </Card>
  );
}
