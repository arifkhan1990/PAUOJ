"use client";

import { useEffect, useState } from "react";

/**
 * Picks the last section whose top has crossed the reading offset.
 * `tops` are distances from the scroll root (viewport when root is null);
 * `null` marks an element that is not on the page.
 */
export function resolveActiveSection(
  ids: string[],
  tops: Array<number | null>,
  offset: number,
  atBottom: boolean,
): string {
  if (ids.length === 0) return "";
  let index = 0;
  tops.forEach((top, position) => {
    if (top !== null && top <= offset) index = position;
  });
  if (atBottom) return ids[ids.length - 1] ?? "";
  return ids[index] ?? "";
}

/**
 * Scrollspy for a list of section ids.
 * - `rootId` set: tracks that element's own scroll (docs reference layout).
 * - `rootId` null/omitted: tracks the page (window) scroll.
 */
export function useActiveSection(
  ids: string[],
  rootId?: string | null,
  offset = 120,
): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const root = rootId ? document.getElementById(rootId) : null;
    if (rootId && !root) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rootTop = root ? root.getBoundingClientRect().top : 0;
      const tops = ids.map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;
        return element.getBoundingClientRect().top - rootTop;
      });
      const atBottom = root
        ? root.scrollTop + root.clientHeight >= root.scrollHeight - 2
        : window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      const current = resolveActiveSection(ids, tops, offset, atBottom);
      setActive((previous) => (previous === current ? previous : current));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    const target: EventTarget = root ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, rootId, offset]);

  return active;
}
