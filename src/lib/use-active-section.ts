"use client";

import { useEffect, useState } from "react";

export function useActiveSection(ids: string[], rootId: string): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rootTop = root.getBoundingClientRect().top;
      let current = ids[0] ?? "";

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top - rootTop;
        if (top <= 120) current = id;
        else break;
      }

      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
        current = ids[ids.length - 1] ?? current;
      }

      setActive((previous) => (previous === current ? previous : current));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, rootId]);

  return active;
}
