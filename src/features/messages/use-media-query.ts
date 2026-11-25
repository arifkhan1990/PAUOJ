"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query. The initial value is read synchronously in the
 * browser so a panel that mounts after a click never flashes the drawer state
 * on a desktop viewport; layout itself stays in CSS so SSR is unaffected.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
