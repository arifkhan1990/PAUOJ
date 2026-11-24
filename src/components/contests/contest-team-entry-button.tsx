"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  UsersRound,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  contestTeamCreateSchema,
  contestTeamJoinSchema,
} from "@/lib/schemas/contest-ops";
import type { ContestTeamView } from "@/lib/contest-ops";
import { cn } from "@/lib/utils";

function teamsApiPath(slug: string): string {
  return `/api/v1/contests/${encodeURIComponent(slug)}/teams`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | null;
}) {
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

function modeButtonClass(active: boolean): string {
  return cn(
    "inline-flex h-11 items-center justify-center rounded-md px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50",
    active
      ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border"
      : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
  );
}

type TeamMode = "create" | "join";

/**
 * The single team entry point in the contest hero. The form lives in a native
 * dialog so the page has one action instead of a duplicate inline form card.
 */
export function ContestTeamEntryButton({
  slug,
  maxMembers,
  canCreate,
  canJoin,
  className,
  label = "Create or join a team",
}: {
  slug: string;
  maxMembers: number;
  canCreate: boolean;
  canJoin: boolean;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TeamMode>(canCreate ? "create" : "join");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState<TeamMode | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  const both = canCreate && canJoin;

  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = mode === "create" ? nameRef.current : codeRef.current;
    const timer = window.setTimeout(() => target?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, mode]);

  if (!canCreate && !canJoin) return null;

  const title = both
    ? "Create or join a team"
    : canCreate
      ? "Create a team"
      : "Join with an invite code";
  const description = both
    ? `Up to ${maxMembers} coders per team. Create a new team or join one with an invite code.`
    : canCreate
      ? `Up to ${maxMembers} coders per team. You become the captain and get an invite code.`
      : "Ask the team captain for the code. One contest team per coder.";

  const openModal = () => {
    setMode(canCreate ? "create" : "join");
    setCreateError(null);
    setJoinError(null);
    setOpen(true);
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    setCreateError(null);
    setJoinError(null);
  };

  const changeMode = (next: TeamMode) => {
    if (busy) return;
    setMode(next);
    setCreateError(null);
    setJoinError(null);
  };

  const createTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    const parsed = contestTeamCreateSchema.safeParse({ name });
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Check the team name.");
      return;
    }
    setBusy("create");
    try {
      await apiPost<ContestTeamView>(teamsApiPath(slug), parsed.data);
      setName("");
      setOpen(false);
      toast({
        title: "Team created",
        description: "Invite teammates by username or share the invite code.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      setCreateError(errorMessage(error, "Could not create the team."));
    } finally {
      setBusy(null);
    }
  };

  const joinTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoinError(null);
    const parsed = contestTeamJoinSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setJoinError(parsed.error.issues[0]?.message ?? "Enter a valid code.");
      return;
    }
    setBusy("join");
    try {
      await apiPost<ContestTeamView>(
        `${teamsApiPath(slug)}/join`,
        parsed.data,
      );
      setInviteCode("");
      setOpen(false);
      toast({
        title: "You joined the team",
        description: "You are registered for this contest.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      setJoinError(errorMessage(error, "Could not join that team."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        className={className}
        onClick={openModal}
      >
        <UsersRound className="size-4" aria-hidden="true" />
        {label}
      </Button>

      <Modal
        open={open}
        title={title}
        description={description}
        onClose={close}
        closeDisabled={busy !== null}
      >
        {both ? (
          <div
            role="group"
            aria-label="Team action"
            className="grid grid-cols-2 gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
          >
            <button
              type="button"
              aria-pressed={mode === "create"}
              onClick={() => changeMode("create")}
              disabled={busy !== null}
              className={modeButtonClass(mode === "create")}
            >
              Create team
            </button>
            <button
              type="button"
              aria-pressed={mode === "join"}
              onClick={() => changeMode("join")}
              disabled={busy !== null}
              className={modeButtonClass(mode === "join")}
            >
              Join with code
            </button>
          </div>
        ) : null}

        {mode === "create" ? (
          <form
            onSubmit={(event) => void createTeam(event)}
            className={cn("space-y-4", both && "mt-4")}
          >
            <div className="space-y-1.5">
              <Label htmlFor="contest-team-name">Team name</Label>
              <Input
                ref={nameRef}
                id="contest-team-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (createError) setCreateError(null);
                }}
                minLength={3}
                maxLength={40}
                autoComplete="off"
                placeholder="e.g. Segfault Society"
                className="h-11"
                disabled={busy !== null}
                aria-invalid={createError ? true : undefined}
                aria-describedby={
                  createError ? "contest-team-name-error" : undefined
                }
              />
              <FieldError id="contest-team-name-error" message={createError} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={close}
                disabled={busy !== null}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={busy !== null}>
                {busy === "create" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UsersRound className="size-4" aria-hidden="true" />
                )}
                Create team
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(event) => void joinTeam(event)}
            className={cn("space-y-4", both && "mt-4")}
          >
            <div className="space-y-1.5">
              <Label htmlFor="contest-team-code">Invite code</Label>
              <Input
                ref={codeRef}
                id="contest-team-code"
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value);
                  if (joinError) setJoinError(null);
                }}
                minLength={6}
                maxLength={32}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="Paste the team code"
                className="h-11 font-mono"
                disabled={busy !== null}
                aria-invalid={joinError ? true : undefined}
                aria-describedby={
                  joinError ? "contest-team-code-error" : undefined
                }
              />
              <FieldError id="contest-team-code-error" message={joinError} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={close}
                disabled={busy !== null}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={busy !== null}>
                {busy === "join" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                )}
                Join team
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
