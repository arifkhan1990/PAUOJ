"use client";

import { useCallback, useEffect, useState } from "react";
import { BellOff, BellRing, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost, apiRequest } from "@/lib/api-client";

type PushStatus =
  | "loading"
  | "unsupported"
  | "insecure"
  | "unconfigured"
  | "denied"
  | "idle"
  | "subscribed"
  | "error";

const STATUS_NOTES: Record<PushStatus, string> = {
  loading: "Checking this browser…",
  unsupported: "Push notifications are not supported in this browser.",
  insecure: "Push needs a secure (HTTPS) connection.",
  unconfigured: "Push notifications are not configured for this site.",
  denied:
    "Push is blocked for this site. Allow notifications in your browser settings, then reload.",
  idle: "Not enabled on this device.",
  subscribed: "Enabled on this device.",
  error: "Could not check push support on this device.",
};

/** Decode a base64url VAPID key into the bytes PushManager expects. */
export function urlBase64ToUint8Array(
  base64Url: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function PushToggle() {
  const { toast } = useToast();
  const [status, setStatus] = useState<PushStatus>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("insecure");
      return;
    }

    try {
      const result = await apiRequest<{ publicKey: string | null }>(
        "/api/v1/push/public-key",
      );
      if (!result.publicKey) {
        setStatus("unconfigured");
        return;
      }

      setPublicKey(result.publicKey);
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Reconcile the server copy on every visit; the idempotent POST also
        // repairs a Redis flush or a subscription created on another deploy.
        const payload = subscription.toJSON();
        const endpoint = payload.endpoint ?? subscription.endpoint;
        const p256dh = payload.keys?.p256dh;
        const auth = payload.keys?.auth;
        if (endpoint && p256dh && auth) {
          await apiPost("/api/v1/push/subscribe", {
            endpoint,
            keys: { p256dh, auth },
          }).catch(() => undefined);
        }
      }
      setSubscribed(subscription !== null);
      setStatus(
        Notification.permission === "denied"
          ? "denied"
          : subscription
            ? "subscribed"
            : "idle",
      );
    } catch (cause) {
      setError(errorMessage(cause));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enable = async () => {
    if (!publicKey) return;
    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        const denied = permission === "denied";
        setStatus(denied ? "denied" : "idle");
        setError(
          denied ? null : "Notification permission was not granted.",
        );
        if (denied) {
          toast({
            title: "Push notifications are blocked",
            description:
              "Allow notifications for this site in your browser settings.",
            variant: "warning",
          });
        }
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const payload = subscription.toJSON();
      const endpoint = payload.endpoint ?? subscription.endpoint;
      const p256dh = payload.keys?.p256dh;
      const auth = payload.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        throw new Error("The browser did not return a complete subscription.");
      }

      try {
        await apiPost("/api/v1/push/subscribe", {
          endpoint,
          keys: { p256dh, auth },
        });
      } catch (cause) {
        if (!existing) {
          await subscription.unsubscribe().catch(() => undefined);
        }
        throw cause;
      }

      setSubscribed(true);
      setStatus("subscribed");
      toast({
        title: "Push notifications enabled",
        description: "This device will receive alerts for the activity you allow.",
        variant: "success",
      });
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast({
        title: "Could not enable push notifications",
        description: message,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (subscription) {
        try {
          await apiRequest("/api/v1/push/subscribe", {
            method: "DELETE",
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        } catch (cause) {
          if (!(cause instanceof ApiClientError && cause.status === 404)) {
            throw cause;
          }
        }
        const removed = await subscription.unsubscribe();
        if (!removed) {
          throw new Error(
            "The browser could not remove this push subscription.",
          );
        }
      }

      setSubscribed(false);
      setStatus(Notification.permission === "denied" ? "denied" : "idle");
      toast({
        title: "Push notifications disabled",
        description: "This device will no longer receive push alerts.",
        variant: "success",
      });
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast({
        title: "Could not disable push notifications",
        description: message,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const Icon = subscribed ? BellRing : BellOff;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Browser push</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Get alerts on this device even when the tab is closed. Each browser
            is enabled separately.
          </p>
          <p
            className="mt-1 text-[11px] text-muted-foreground"
            aria-live="polite"
          >
            {STATUS_NOTES[status]}
          </p>
          {error ? (
            <p role="alert" className="mt-1 break-words text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {status === "error" ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={() => void load()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Retry
        </Button>
      ) : status === "unsupported" ||
        status === "insecure" ||
        status === "unconfigured" ||
        status === "denied" ? null : (
        <Button
          type="button"
          variant={subscribed ? "outline" : "default"}
          className="h-11 w-full sm:w-auto"
          onClick={() => void (subscribed ? disable() : enable())}
          disabled={busy || status === "loading"}
          aria-busy={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : subscribed ? (
            <BellOff className="size-4" />
          ) : (
            <BellRing className="size-4" />
          )}
          {busy
            ? subscribed
              ? "Disabling…"
              : "Enabling…"
            : subscribed
              ? "Disable on this device"
              : "Enable on this device"}
        </Button>
      )}
    </div>
  );
}
