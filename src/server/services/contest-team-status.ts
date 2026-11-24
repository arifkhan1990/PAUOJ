import type { ContestTeamStatus } from "@/lib/contest-ops";

/**
 * Teams that still compete: forming before the start, or registered. Kept in
 * its own module so invite queries can use it without importing the shared
 * team service (which imports the invite queries back).
 */
export const LIVE_TEAM_STATUSES: ContestTeamStatus[] = [
  "FORMING",
  "REGISTERED",
];
