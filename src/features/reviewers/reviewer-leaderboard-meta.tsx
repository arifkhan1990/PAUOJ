import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ReviewerLeaderboardRow } from "@/lib/reviewer-leaderboard-types";

type ReviewerRole = ReviewerLeaderboardRow["role"];

const ROLE_META: Record<
  ReviewerRole,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  ADMIN: { label: "Admin", variant: "default" },
  TEACHER: { label: "Setter", variant: "accent" },
  USER: { label: "Member", variant: "muted" },
};

export function ReviewerRoleBadge({ role }: { role: ReviewerRole }) {
  const meta = ROLE_META[role];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const countFormatter = new Intl.NumberFormat("en-US");

export function formatReviewCount(value: number): string {
  return countFormatter.format(value);
}

export function formatReviewHours(hours: number | null): string {
  if (hours === null) return "—";
  return `${hours.toFixed(1)} h`;
}
