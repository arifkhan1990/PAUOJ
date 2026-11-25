"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 90_000;

/** Keeps the signed-in user's presence fresh while the tab is visible. */
export function PresenceHeartbeat() {
  useEffect(() => {
    let active = true;

    const beat = () => {
      if (!active || document.visibilityState !== "visible") return;
      void fetch("/api/v1/presence/heartbeat", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {
        // Presence is best-effort; failures must stay invisible to the user.
      });
    };

    beat();
    const interval = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
