"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ReportButton } from "@/features/moderation/report-dialog";
import type { ConversationThread } from "@/lib/message-types";
import { cn } from "@/lib/utils";
import { ConversationMuteButton } from "./conversation-mute-button";
import { PresenceLabel } from "./presence-dot";

/**
 * Pinned thread header. The name/avatar is the single trigger for the info
 * panel, so the whole identity block stays one 44px control.
 */
export function ConversationHeader({
  conversationId,
  participant,
  muted,
  infoOpen,
  infoPanelId,
  onToggleInfo,
  triggerRef,
}: {
  conversationId: string;
  participant: ConversationThread["participant"];
  muted: boolean;
  infoOpen: boolean;
  infoPanelId: string;
  onToggleInfo: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="flex min-h-16 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2 py-1.5 sm:gap-2 sm:px-3">
      <Link
        href="/dashboard/messages"
        aria-label="Back to messages"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>

      <button
        ref={triggerRef}
        type="button"
        onClick={onToggleInfo}
        aria-expanded={infoOpen}
        aria-controls={infoPanelId}
        aria-label={`${infoOpen ? "Hide" : "Show"} conversation info for ${participant.displayName}`}
        title="Conversation info"
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          infoOpen ? "bg-muted" : "hover:bg-muted/60",
        )}
      >
        <UserAvatar
          name={participant.displayName}
          username={participant.username}
          size="md"
          avatarPreset={participant.avatarPreset}
          avatarImageAt={participant.avatarImageUpdatedAt}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {participant.displayName}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {participant.presence.state === "HIDDEN" ? (
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                @{participant.username}
              </span>
            ) : (
              <PresenceLabel presence={participant.presence} />
            )}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            infoOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <ConversationMuteButton conversationId={conversationId} muted={muted} />
        <ReportButton
          kind="CONVERSATION"
          username={participant.username}
          conversationId={conversationId}
          ariaLabel="Report conversation"
          iconOnly
        />
      </div>
    </header>
  );
}
