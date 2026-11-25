"use client";

import { useState, type KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { MESSAGE_MAX_LENGTH } from "./message-format";

const COUNTER_THRESHOLD = MESSAGE_MAX_LENGTH - 200;

export function MessageComposer({
  blocked,
  onSend,
}: {
  blocked: boolean;
  onSend: (body: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = body.trim();
    if (!value || sending || blocked) return;
    setSending(true);
    setError(null);
    try {
      await onSend(value);
      setBody("");
    } catch (requestError) {
      const description =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Please check your connection and try again.";
      setError(description);
      toast({
        title: "Message not sent",
        description,
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  };

  const nearLimit = body.length >= COUNTER_THRESHOLD;
  const disabled = blocked || sending;

  return (
    <form
      className="border-t border-border p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="message-body" className="sr-only">
        Message
      </label>
      <Textarea
        id="message-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={MESSAGE_MAX_LENGTH}
        rows={2}
        placeholder="Write a message…"
        disabled={disabled}
        aria-describedby="message-counter"
        className="max-h-40 min-h-11 resize-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p
          id="message-counter"
          aria-live="off"
          className={cn(
            "min-h-4 text-[11px] tabular-nums",
            nearLimit
              ? "font-medium text-amber-700 dark:text-amber-400"
              : "text-muted-foreground",
          )}
        >
          {nearLimit ? (
            `${body.length.toLocaleString("en-US")} / ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")}`
          ) : (
            <span className="hidden sm:inline">
              Enter to send · Shift + Enter for a new line
            </span>
          )}
        </p>
        <Button
          type="submit"
          className="min-h-11 px-4"
          disabled={disabled || body.trim().length === 0}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Send
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
