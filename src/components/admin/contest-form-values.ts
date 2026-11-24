import type { ContestDivision, AdminContestDetail } from "@/lib/types";
import type { ContestFormat } from "@/lib/contest-ops";

export type ContestFormValues = {
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: ContestDivision;
  format: ContestFormat;
  teamSize: string;
  isOfficial: boolean;
  requiresFreshProblems: boolean;
  feeBdt: string;
  feeReference: string;
  eligibility: string;
  rules: string;
  prizes: string;
  freezeMinutes: string;
  problemIds: string[];
};

export type ContestFormUpdate = <K extends keyof ContestFormValues>(
  key: K,
  value: ContestFormValues[K],
) => void;

/** `datetime-local` needs a wall-clock string without a zone suffix. */
export function toLocalDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/**
 * The admin detail now exposes the payment reference, so the form round-trips
 * it without clearing the fee metadata on save.
 */
function readFeeReference(initial: AdminContestDetail | null): string {
  return initial?.feeReference ?? "";
}

export function defaultContestFormValues(
  initial: AdminContestDetail | null,
): ContestFormValues {
  if (!initial) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      title: "",
      slug: "",
      description: "",
      bannerUrl: "",
      startAt: toLocalDateTime(start.toISOString()),
      endAt: toLocalDateTime(end.toISOString()),
      isPublic: true,
      division: "OPEN",
      format: "SINGLE",
      teamSize: "3",
      isOfficial: false,
      requiresFreshProblems: true,
      feeBdt: "",
      feeReference: "",
      eligibility: "",
      rules: "",
      prizes: "",
      freezeMinutes: "0",
      problemIds: [],
    };
  }
  return {
    title: initial.title,
    slug: initial.slug,
    description: initial.description,
    bannerUrl: initial.bannerUrl ?? "",
    startAt: toLocalDateTime(initial.startAt),
    endAt: toLocalDateTime(initial.endAt),
    isPublic: initial.isPublic,
    division: initial.division,
    format: initial.format,
    teamSize: String(initial.teamSize),
    isOfficial: initial.isOfficial,
    requiresFreshProblems: initial.requiresFreshProblems,
    feeBdt: initial.feeBdt === null ? "" : String(initial.feeBdt),
    feeReference: readFeeReference(initial),
    eligibility: initial.eligibility ?? "",
    rules: initial.rules ?? "",
    prizes: initial.prizes ?? "",
    freezeMinutes: String(initial.freezeMinutes),
    problemIds: initial.problemIds,
  };
}

/**
 * Shape handed to `contestInputSchema`. Empty optional strings become
 * `undefined` so the schema applies its defaults instead of failing max/min.
 */
export function contestInputFromValues(values: ContestFormValues) {
  const fee = values.feeBdt.trim();
  return {
    title: values.title,
    slug: values.slug.trim() || undefined,
    description: values.description,
    bannerUrl: values.bannerUrl.trim() || undefined,
    isPublic: values.isPublic,
    division: values.division,
    format: values.format,
    teamSize: Number(values.teamSize || "3"),
    isOfficial: values.isOfficial,
    requiresFreshProblems: values.requiresFreshProblems,
    feeBdt: fee ? Number(fee) : undefined,
    feeReference: values.feeReference.trim() || undefined,
    eligibility: values.eligibility.trim() || undefined,
    rules: values.rules.trim() || undefined,
    prizes: values.prizes.trim() || undefined,
    freezeMinutes: Number(values.freezeMinutes || "0"),
    problemIds: values.problemIds,
  };
}
