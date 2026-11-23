import { ApiError } from "@/server/api/errors";

export type LockedProblem = {
  kind: "contest" | "assessment" | "premium";
  slug: string;
  title: string;
  moduleSlug?: string;
};

export function lockedProblemFrom(error: unknown): LockedProblem | null {
  if (
    !(error instanceof ApiError) ||
    (error.code !== "CONTEST_LOCKED" &&
      error.code !== "ASSESSMENT_LOCKED" &&
      error.code !== "PREMIUM_LOCKED")
  ) {
    return null;
  }
  const details = error.details;
  if (
    typeof details === "object" &&
    details !== null &&
    "slug" in details &&
    "title" in details &&
    typeof details.slug === "string" &&
    typeof details.title === "string"
  ) {
    const kind =
      error.code === "ASSESSMENT_LOCKED"
        ? "assessment"
        : error.code === "PREMIUM_LOCKED"
          ? "premium"
          : "contest";
    const moduleSlug =
      "moduleSlug" in details && typeof details.moduleSlug === "string"
        ? details.moduleSlug
        : undefined;
    return {
      kind,
      slug: details.slug,
      title: details.title,
      moduleSlug,
    };
  }
  return null;
}
