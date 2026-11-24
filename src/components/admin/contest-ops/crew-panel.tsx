"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserMinus, Users } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError } from "@/lib/api-client";
import {
  CONTEST_STAFF_ROLES,
  CONTEST_STAFF_ROLE_DESCRIPTION,
  CONTEST_STAFF_ROLE_LABEL,
  type ContestStaffRole,
  type ContestStaffStatus,
  type ContestStaffView,
} from "@/lib/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { addContestStaff, removeContestStaff } from "./contest-ops-api";

const ROLE_OPTIONS: SelectOption[] = CONTEST_STAFF_ROLES.map((role) => ({
  value: role,
  label: CONTEST_STAFF_ROLE_LABEL[role],
  description: CONTEST_STAFF_ROLE_DESCRIPTION[role],
}));

function statusVariant(
  status: ContestStaffStatus,
): "warning" | "success" | "muted" | "destructive" {
  if (status === "ACCEPTED") return "success";
  if (status === "INVITED") return "warning";
  if (status === "DECLINED") return "muted";
  return "destructive";
}

export function CrewPanel({
  contestId,
  initialStaff,
  readOnly = false,
}: {
  contestId: string;
  initialStaff: ContestStaffView[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [staff, setStaff] = useState(initialStaff);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<ContestStaffRole>("SETTER");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ContestStaffView | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError("Enter a username with at least two characters.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const created = await addContestStaff(contestId, {
        username: trimmed,
        role,
      });
      setStaff((current) => [...current, created]);
      setUsername("");
      toast({
        title: "Crew member added",
        description: `${created.displayName} · ${CONTEST_STAFF_ROLE_LABEL[created.role]}`,
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not add this crew member.";
      setError(message);
      toast({ title: "Add failed", description: message, variant: "error" });
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setRemovePending(true);
    setRemoveError(null);
    try {
      await removeContestStaff(contestId, removing.id);
      setStaff((current) => current.filter((item) => item.id !== removing.id));
      toast({
        title: "Crew member removed",
        description: `@${removing.username} can compete again.`,
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not remove this crew member.";
      setRemoveError(message);
      toast({ title: "Remove failed", description: message, variant: "error" });
    } finally {
      setRemovePending(false);
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Contest crew</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Invited or accepted crew cannot register, join a team or submit in
          this contest. Only a director can run the round; setters, editorial
          writers, testers and observers stay blind to the statements while it
          runs.
        </p>

        {readOnly ? (
          <p className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Only an admin or a contest director can change the crew roster.
          </p>
        ) : (
          <form onSubmit={(event) => void add(event)} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-username">Username</Label>
              <Input
                id="staff-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="coder_username"
                autoComplete="off"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-role">Role</Label>
              <SearchableSelect
                id="staff-role"
                value={role}
                onValueChange={(next) => setRole(next as ContestStaffRole)}
                options={ROLE_OPTIONS}
                searchable={false}
              />
              <p className="text-[11px] text-muted-foreground">
                {CONTEST_STAFF_ROLE_DESCRIPTION[role]}
              </p>
            </div>
          </div>
          {error ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={adding}>
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add crew member
          </Button>
        </form>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Crew list</h3>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {staff.length} {staff.length === 1 ? "member" : "members"}
          </span>
        </div>

        {staff.length === 0 ? (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-dashed border-border p-4">
            <Users
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">No crew assigned yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add a setter, editorial writer, tester or observer by username.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {staff.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.displayName}{" "}
                    <span className="font-mono text-[11px] font-normal text-muted-foreground">
                      @{member.username}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      {CONTEST_STAFF_ROLE_LABEL[member.role]}
                    </Badge>
                    <Badge variant={statusVariant(member.status)}>
                      {member.status.charAt(0) +
                        member.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
                {readOnly ? null : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 text-destructive sm:min-h-0"
                    onClick={() => setRemoving(member)}
                    disabled={removePending}
                  >
                    <UserMinus className="size-4" />
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {removeError ? (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {removeError}
          </p>
        ) : null}
      </Card>

      <ConfirmDialog
        open={removing !== null}
        title="Remove this crew member?"
        description={
          removing
            ? `@${removing.username} will lose ${CONTEST_STAFF_ROLE_LABEL[removing.role].toLowerCase()} access and will be able to compete in this contest again.`
            : ""
        }
        confirmLabel="Remove from crew"
        pending={removePending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
