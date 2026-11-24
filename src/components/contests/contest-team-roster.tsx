import Link from "next/link";
import { Crown, Ticket } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import type { ContestTeamMemberView } from "@/lib/contest-ops";

export function ContestTeamRoster({
  members,
}: {
  members: ContestTeamMemberView[];
}) {
  return (
    <ul className="mt-4 divide-y divide-border rounded-md border border-border">
      {members.map((member) => (
        <li key={member.userId} className="flex items-center gap-2.5 px-3 py-2.5">
          <UserAvatar
            name={member.displayName}
            username={member.username}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/users/${member.username}`}
              className="block truncate text-sm font-medium hover:text-primary"
            >
              {member.displayName}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              @{member.username}
            </span>
          </div>
          {member.role === "CAPTAIN" ? (
            <Badge variant="outline" className="gap-1">
              <Crown className="size-3" aria-hidden="true" />
              Captain
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ContestTeamInviteCode({ code }: { code: string }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <Ticket className="size-3.5" aria-hidden="true" />
            Share code instead
          </p>
          <code className="mt-1 block break-all font-mono text-sm">{code}</code>
        </div>
        <CopyButton value={code} label="Copy invite code" className="h-11" />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Team members can share this code with a coder who has no invitation.
        Inviting by username above is the primary path. Teammates join from this
        contest page before the round starts.
      </p>
    </div>
  );
}
