"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function MessageButton({
  username,
  compact = false,
}: {
  username: string;
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const openConversation = async () => {
    if (pending) return;
    setPending(true);
    try {
      const conversation = await apiPost<{ id: string }>(
        "/api/v1/messages/conversations",
        { username },
      );
      router.push(`/dashboard/messages/${conversation.id}`);
    } catch (error) {
      toast({
        title: "Could not start a conversation",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again in a moment.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void openConversation()}
      disabled={pending}
      aria-busy={pending}
      aria-label={`Message @${username}`}
      className={
        compact
          ? "h-11 gap-1.5 rounded-lg px-3 text-xs sm:h-9"
          : "h-11 gap-1.5 rounded-lg px-3.5 text-sm"
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <MessageSquare className="size-4" aria-hidden="true" />
      )}
      Message
    </Button>
  );
}
