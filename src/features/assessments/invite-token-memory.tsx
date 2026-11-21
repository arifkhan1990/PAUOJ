"use client";

import { useEffect } from "react";

/**
 * Hand the invite token to the token-free `/invite` route through
 * sessionStorage, so sign-in does not have to carry it in the URL.
 */
export function InviteTokenMemory({
  slug,
  token,
}: {
  slug: string;
  token: string;
}) {
  useEffect(() => {
    try {
      sessionStorage.setItem(`pauoj:invite:${slug}`, token);
    } catch {
      // Storage can be unavailable (private mode); the invite route still works.
    }
  }, [slug, token]);

  return null;
}
