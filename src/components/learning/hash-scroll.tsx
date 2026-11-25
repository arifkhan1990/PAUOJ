"use client";

import { useEffect } from "react";

/**
 * The module page streams its checkpoint card after the initial document load,
 * so the browser's native hash scroll fires before `#checkpoint` exists and
 * before late content finishes growing the page. Retry the scroll while the
 * stream settles, and stop immediately if the reader scrolls or presses a key.
 * Renders nothing.
 */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length < 2) return;

    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let timers: number[] = [];

    const scrollToTarget = () => {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (!target) return;
      const margin =
        Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      if (Math.abs(target.getBoundingClientRect().top - margin) < 8) return;
      target.scrollIntoView({ block: "start", behavior: "auto" });
    };

    const cancel = () => {
      cancelled = true;
      observer?.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };

    observer = new MutationObserver(scrollToTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    timers = [0, 150, 500, 1000, 1500, 2200].map((delay) =>
      window.setTimeout(scrollToTarget, delay),
    );
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", cancel, { once: true });

    return cancel;
  }, []);

  return null;
}
