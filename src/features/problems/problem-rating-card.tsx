"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Card } from "@/components/ui/card";
import { ApiClientError, apiPut } from "@/lib/api-client";
import type { ProblemRatingSummary } from "@/lib/types";

function StarRow({
  value,
  interactive,
  onChange,
}: {
  value: number;
  interactive: boolean;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Rate this problem" : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = shown >= star ? 1 : shown >= star - 0.5 ? 0.5 : 0;
        return (
          <span key={star} className="relative size-7">
            <Star className="absolute inset-0 size-7 text-muted-foreground/50" />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-7 fill-amber-400 text-amber-400" />
            </span>
            {interactive ? (
              <>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 w-1/2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${star - 0.5} stars`}
                  onMouseEnter={() => setHover(star - 0.5)}
                  onClick={() => onChange(star - 0.5)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 w-1/2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${star} stars`}
                  onMouseEnter={() => setHover(star)}
                  onClick={() => onChange(star)}
                />
              </>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function ProblemRatingCard({
  slug,
  initial,
  canRate,
}: {
  slug: string;
  initial: ProblemRatingSummary;
  canRate: boolean;
}) {
  const { toast } = useToast();
  const [summary, setSummary] = useState(initial);
  const [saving, setSaving] = useState(false);

  const rate = async (rating: number) => {
    if (!canRate || saving) return;
    setSaving(true);
    try {
      const next = await apiPut<ProblemRatingSummary>(
        `/api/v1/problems/${slug}/rating`,
        { rating },
      );
      setSummary(next);
    } catch (error) {
      toast({
        title: "Could not save your rating",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Community rating</h2>
        {saving ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StarRow
          value={summary.myRating ?? 0}
          interactive={canRate}
          onChange={(rating) => void rate(rating)}
        />
        <span className="text-sm font-semibold tabular-nums">
          {summary.average === null ? "—" : summary.average.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">
          {summary.count === 0
            ? "no ratings yet"
            : `${summary.count} ${summary.count === 1 ? "rating" : "ratings"}`}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {canRate
          ? summary.myRating
            ? `You rated this ${summary.myRating} / 5. Click again to change it.`
            : "Click the left or right half of a star to rate."
          : "Sign in to rate this problem."}
      </p>
    </Card>
  );
}
