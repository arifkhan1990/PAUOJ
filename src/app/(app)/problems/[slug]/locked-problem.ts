import { ApiError } from "@/server/api/errors";

export type LockedProblem = {
  kind: "contest" | "assessment" | "premium" | "crew";
  slug: string;
  title: string;
  moduleSlug?: string;
  role?: string;
};

export function lockedProblemFrom(error: unknown): LockedProblem | null {
  if (
    !(error instanceof ApiError) ||
    (error.code !== "CONTEST_LOCKED" &&
      error.code !== "CONTEST_CREW_LOCKED" &&
      error.code !== "ASSESSMENT_LOCKED" &&
      error.code !== "PREMIUM_LOCKED")
  ) {
    return null;
  }
  const details = error.details;
  if (
    typeof details !== "object" ||
    details === null ||
    !("title" in details) ||
    typeof details.title !== "string"
  ) {
    return null;
  }
  const slug =
    "slug" in details && typeof details.slug === "string"
      ? details.slug
      : "contestSlug" in details && typeof details.contestSlug === "string"
        ? details.contestSlug
        : null;
  if (!slug) return null;
  const kind =
    error.code === "ASSESSMENT_LOCKED"
      ? "assessment"
      : error.code === "PREMIUM_LOCKED"
        ? "premium"
        : error.code === "CONTEST_CREW_LOCKED"
          ? "crew"
          : "contest";
  const locked: LockedProblem = { kind, slug, title: details.title };
  if ("moduleSlug" in details && typeof details.moduleSlug === "string") {
    locked.moduleSlug = details.moduleSlug;
  }
  if ("role" in details && typeof details.role === "string") {
    locked.role = details.role;
  }
  return locked;
}
