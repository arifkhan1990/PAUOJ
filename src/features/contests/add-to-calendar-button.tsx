"use client";

import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  buildContestCalendar,
  contestCalendarFilename,
} from "@/lib/contest-calendar";
import { cn } from "@/lib/utils";

export function AddToCalendarButton({
  slug,
  title,
  description,
  startAt,
  endAt,
  ended,
  className,
}: {
  slug: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  ended?: boolean;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const download = () => {
    if (pending || ended) return;
    setPending(true);
    let objectUrl: string | null = null;
    try {
      const ics = buildContestCalendar({
        title,
        description,
        startAt,
        endAt,
        url: `${window.location.origin}/contests/${encodeURIComponent(slug)}`,
        uidSeed: slug,
      });
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = contestCalendarFilename(slug);
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast({
        title: "Calendar file downloaded",
        description: "Open it to add the contest to your calendar.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not build the calendar file",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      if (objectUrl) {
        const url = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      }
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={download}
      disabled={pending || ended}
      aria-busy={pending}
      aria-label={`Add to calendar: ${title}`}
      title={ended ? "This contest has already ended" : undefined}
      className={cn("h-11 justify-start gap-2", className)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <CalendarPlus className="size-4" aria-hidden="true" />
      )}
      Add to calendar
    </Button>
  );
}
