import type { ContestIntegrityEventType, ContestStaffRole } from "./contest-ops";
import type { ContestStatus } from "./types";

/**
 * Pure contest security policy (no DB, no DOM).
 * Shared by the problem service, the integrity shield and tests.
 */

/** Crew roles that must not open running contest problem statements. */
export const CONTEST_CREW_BLOCKED_ROLES = [
  "SETTER",
  "EDITORIAL",
  "TESTER",
  "OBSERVER",
] as const satisfies readonly ContestStaffRole[];

/** True while the round is running: crew blind access is enforced. */
export function isContestCrewBlocked(status: ContestStatus): boolean {
  return status === "RUNNING";
}

export function isContestCrewRoleBlocked(role: ContestStaffRole): boolean {
  return (CONTEST_CREW_BLOCKED_ROLES as readonly string[]).includes(role);
}

export type ContestCrewProblemAccess = {
  allowed: boolean;
  reason: "ALLOWED" | "DIRECTOR_PREVIEW" | "CREW_BLOCKED";
};

/**
 * Crew statement policy: outside a running round everyone may view;
 * while RUNNING only DIRECTOR (preview) passes, every other crew role
 * is blocked.
 */
export function contestCrewProblemAccess(input: {
  status: ContestStatus;
  role: ContestStaffRole;
}): ContestCrewProblemAccess {
  if (!isContestCrewBlocked(input.status)) {
    return { allowed: true, reason: "ALLOWED" };
  }
  if (input.role === "DIRECTOR") {
    return { allowed: true, reason: "DIRECTOR_PREVIEW" };
  }
  return { allowed: false, reason: "CREW_BLOCKED" };
}

export type ContestWatermarkInput = {
  displayName: string | null;
  username: string | null;
  contestSlug: string;
  startAt: string | Date;
};

const WATERMARK_MAX_LENGTH = 160;

function watermarkDate(startAt: string | Date): string {
  const date = typeof startAt === "string" ? new Date(startAt) : startAt;
  if (Number.isNaN(date.getTime())) return "contest";
  return date.toISOString().slice(0, 10);
}

/**
 * Stable per-view watermark: same input always yields the same string.
 * Contains display name, @username, contest slug and the start date so
 * a photographed screen is traceable back to one account.
 */
export function buildContestWatermark(input: ContestWatermarkInput): string {
  const username = (input.username ?? "").trim();
  const displayName = (input.displayName ?? "").trim();
  const name = displayName || username || "contest viewer";
  const handle = username ? ` (@${username})` : "";
  const slug = input.contestSlug.trim() || "contest";
  return `${name}${handle} · ${slug} · ${watermarkDate(input.startAt)}`.slice(
    0,
    WATERMARK_MAX_LENGTH,
  );
}

/** Editorial is sealed for everyone while its contest is running. */
export function isContestEditorialLocked(input: {
  status: ContestStatus;
  hasContestContext: boolean;
}): boolean {
  return input.hasContestContext && input.status === "RUNNING";
}

export const INTEGRITY_EVENT_TYPES = [
  "TAB_HIDDEN",
  "PASTE",
  "COPY",
  "CONTEXT_MENU",
  "PRINT",
  "FULLSCREEN_EXIT",
  "RAPID_SUBMIT",
] as const satisfies readonly ContestIntegrityEventType[];

export function isIntegrityEventType(
  value: unknown,
): value is ContestIntegrityEventType {
  return (
    typeof value === "string" &&
    (INTEGRITY_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export function contestIntegrityEventEndpoint(contestSlug: string): string {
  return `/api/v1/contests/${encodeURIComponent(contestSlug)}/integrity-events`;
}

/** Client-side duplicate throttle for interactive guards (copy, paste, …). */
export const INTEGRITY_EVENT_THROTTLE_MS = 8000;

/** Shorter window for lifecycle events so quick tab flicks still register. */
export const INTEGRITY_LIFECYCLE_EVENT_THROTTLE_MS = 4000;

export type IntegrityThrottleState = Partial<
  Record<ContestIntegrityEventType, number>
>;

export function integrityEventThrottleMs(
  type: ContestIntegrityEventType,
): number {
  return type === "TAB_HIDDEN" || type === "FULLSCREEN_EXIT"
    ? INTEGRITY_LIFECYCLE_EVENT_THROTTLE_MS
    : INTEGRITY_EVENT_THROTTLE_MS;
}

/**
 * Pure throttle decision: the first event of a type is sent, duplicates
 * inside the window are dropped, the next one after the window passes.
 */
export function shouldSendIntegrityEvent(
  state: IntegrityThrottleState,
  type: ContestIntegrityEventType,
  now: number,
): { send: boolean; next: IntegrityThrottleState } {
  const lastAt = state[type];
  if (lastAt === undefined) {
    return { send: true, next: { ...state, [type]: now } };
  }
  if (now - lastAt < integrityEventThrottleMs(type)) {
    return { send: false, next: state };
  }
  return { send: true, next: { ...state, [type]: now } };
}
