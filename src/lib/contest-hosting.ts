import {
  CONTEST_HOSTING_FEE_MAX,
  CONTEST_HOSTING_FEE_MIN,
} from "./contest-ops";

export const CONTEST_HOST_MIN_DURATION_MINUTES = 15;
export const CONTEST_HOST_MAX_DURATION_MINUTES = 24 * 60;

/** Arrangement fees are whole BDT between the published floor and ceiling. */
export function isValidContestHostingFee(fee: number): boolean {
  return (
    Number.isInteger(fee) &&
    fee >= CONTEST_HOSTING_FEE_MIN &&
    fee <= CONTEST_HOSTING_FEE_MAX
  );
}

export type ContestHostWindowCheck =
  | { valid: true; durationMinutes: number }
  | { valid: false; message: string };

/** A hosted round runs once, for at least 15 minutes and at most a day. */
export function checkContestHostWindow(
  startAt: Date,
  endAt: Date,
): ContestHostWindowCheck {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { valid: false, message: "Choose a valid start and end time." };
  }
  const durationMinutes = (endAt.getTime() - startAt.getTime()) / 60_000;
  if (durationMinutes <= 0) {
    return { valid: false, message: "End time must be after the start time." };
  }
  if (durationMinutes < CONTEST_HOST_MIN_DURATION_MINUTES) {
    return {
      valid: false,
      message: `A contest must run for at least ${CONTEST_HOST_MIN_DURATION_MINUTES} minutes.`,
    };
  }
  if (durationMinutes > CONTEST_HOST_MAX_DURATION_MINUTES) {
    return {
      valid: false,
      message: "A contest must run for 24 hours or less.",
    };
  }
  return { valid: true, durationMinutes };
}
