import Link from "next/link";
import { BellOff, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/message-types";
import { cn } from "@/lib/utils";
import {
  conversationPreview,
  conversationRowState,
  formatMessageTime,
  unreadLabel,
} from "./message-format";
import { PresenceDot } from "./presence-dot";

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const { muted, unread, showUnreadBadge } = conversationRowState(
    conversation.muted,
    conversation.unreadCount,
  );
  return (
    <li>
      <Link
        href={`/messages/${conversation.id}`}
        className={cn(
          "flex min-h-11 items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4",
          showUnreadBadge && "bg-primary/5",
        )}
      >
        <span className="relative shrink-0">
          <UserAvatar
            name={conversation.displayName}
            username={conversation.username}
            size="md"
            avatarPreset={conversation.avatarPreset}
            avatarImageAt={conversation.avatarImageUpdatedAt}
          />
          <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center">
            <PresenceDot presence={conversation.presence} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate text-sm font-medium">
                {conversation.displayName}{" "}
                <span className="font-normal text-muted-foreground">
                  @{conversation.username}
                </span>
              </span>
              {muted ? (
                <span
                  className="inline-flex shrink-0 text-muted-foreground"
                  title="Muted"
                >
                  <BellOff className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Muted</span>
                </span>
              ) : null}
            </span>
            <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
              {formatMessageTime(conversation.lastMessageAt)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {conversationPreview(conversation.lastMessage)}
            </span>
            {showUnreadBadge ? (
              <Badge
                className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px] tabular-nums"
                aria-label={unreadLabel(unread) ?? undefined}
              >
                {unread > 99 ? "99+" : unread}
              </Badge>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function ConversationList({
  conversations,
}: {
  conversations: ConversationSummary[];
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="You can message someone who accepted your follow request. Follow a coder, get accepted, then open their profile to say hello."
        action={
          <Link href="/rank" className={cn(buttonVariants(), "min-h-11")}>
            Find coders to follow
          </Link>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <ul className="divide-y divide-border">
        {conversations.map((conversation) => (
          <ConversationRow key={conversation.id} conversation={conversation} />
        ))}
      </ul>
    </Card>
  );
}
