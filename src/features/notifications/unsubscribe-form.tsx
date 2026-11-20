"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type { UnsubscribeScope } from "@/lib/notification-types";

export function UnsubscribeForm({
  token,
  scope,
}: {
  token: string;
  scope: UnsubscribeScope;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const unsubscribe = async () => {
    setState("loading");
    setError(null);
    try {
      await apiPost("/api/v1/notifications/unsubscribe", { token, scope });
      setState("done");
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not update your email preferences.",
      );
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
        <CheckCircle2 className="size-5 shrink-0" />
        You have been unsubscribed. You can turn emails back on from Settings.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="destructive"
        onClick={() => void unsubscribe()}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MailX className="size-4" />
        )}
        Unsubscribe
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
