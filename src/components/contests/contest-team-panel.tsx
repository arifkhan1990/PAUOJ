"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  LockKeyhole,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import {
  ContestTeamInvitePanel,
  ContestTeamSignedOutCard,
  IncomingTeamInviteCard,
} from "./contest-team-invites";
import { ContestTeamInviteCode, ContestTeamRoster } from "./contest-team-roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError, apiDelete } from "@/lib/api-client";
import type {
  ContestTeamInviteView,
  ContestTeamStatus,
  ContestTeamView,
} from "@/lib/contest-ops";

const TEAM_STATUS_LABEL: Record<ContestTeamStatus, string> = {
  FORMING: "Forming",
  REGISTERED: "Registered",
  WITHDRAWN: "Withdrawn",
  DISQUALIFIED: "Disqualified",
};

function teamsApiPath(slug: string): string {
  return `/api/v1/contests/${encodeURIComponent(slug)}/teams`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ContestTeamPanel({
  slug,
  viewerTeam,
  incomingInvite,
  maxMembers,
  isAuthenticated,
  deadline,
}: {
  slug: string;
  viewerTeam: ContestTeamView | null;
  incomingInvite: ContestTeamInviteView | null;
  maxMembers: number;
  isAuthenticated: boolean;
  deadline: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"leave" | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const deadlineMs = new Date(deadline).getTime();
    if (Number.isNaN(deadlineMs)) return;
    const check = () => setClosed(Date.now() >= deadlineMs);
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const leaveTeam = async () => {
    setBusy("leave");
    try {
      await apiDelete(`${teamsApiPath(slug)}/leave`);
      setConfirmLeave(false);
      toast({
        title: "You left the team",
        description: "You can create or join another team before the start.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not leave the team",
        description: errorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  if (!isAuthenticated) {
    return <ContestTeamSignedOutCard slug={slug} maxMembers={maxMembers} />;
  }

  if (viewerTeam) {
    const team = viewerTeam;
    const active =
      (team.status === "FORMING" || team.status === "REGISTERED") && !closed;
    const limit = team.maxMembers || maxMembers;

    return (
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Your team
              </p>
              <Badge
                variant={
                  team.status === "REGISTERED" || closed
                    ? "success"
                    : team.status === "FORMING"
                      ? "outline"
                      : "muted"
                }
              >
                {closed && team.status === "FORMING"
                  ? "Registered"
                  : TEAM_STATUS_LABEL[team.status]}
              </Badge>
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold">{team.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {team.members.length} of {limit} coders
            </p>
          </div>
          {team.isViewerMember && active ? (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={busy !== null}
              onClick={() => setConfirmLeave(true)}
            >
              {busy === "leave" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="size-4" aria-hidden="true" />
              )}
              {team.status === "REGISTERED" ? "Withdraw" : "Leave team"}
            </Button>
          ) : null}
        </div>

        <ContestTeamRoster members={team.members} />

        <ContestTeamInvitePanel
          slug={slug}
          team={team}
          limit={limit}
          active={active}
        />

        {team.isViewerMember && team.inviteCode && active ? (
          <ContestTeamInviteCode code={team.inviteCode} />
        ) : null}

        {!team.isViewerMember && team.status === "WITHDRAWN" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            This team has withdrawn from the contest.
          </p>
        ) : null}

        <ConfirmDialog
          open={confirmLeave}
          title={team.status === "REGISTERED" ? "Withdraw from the contest?" : "Leave this team?"}
          description={
            team.isViewerCaptain
              ? "You are the captain. If you leave, the team keeps the remaining members and you can join another team before the start."
              : "You can create or join another team before the contest starts."
          }
          confirmLabel={team.status === "REGISTERED" ? "Withdraw" : "Leave team"}
          pending={busy === "leave"}
          onConfirm={() => void leaveTeam()}
          onCancel={() => setConfirmLeave(false)}
        />
      </Card>
    );
  }

  if (closed) {
    return (
      <div className="space-y-3">
        {incomingInvite ? (
          <IncomingTeamInviteCard
            slug={slug}
            invite={incomingInvite}
            closed
          />
        ) : null}
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <LockKeyhole className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            Team formation is closed. Teams lock when the round starts.
          </p>
        </Card>
      </div>
    );
  }

  if (!incomingInvite) return null;

  return (
    <IncomingTeamInviteCard
      slug={slug}
      invite={incomingInvite}
      closed={false}
    />
  );
}
