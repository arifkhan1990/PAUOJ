import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type {
  ContestProblemCandidateView,
  ContestStaffNoteView,
  ContestStaffView,
} from "@/lib/contest-ops";
import type {
  ContestCandidateInput,
  ContestStaffInviteInput,
  ContestStaffNoteInput,
} from "@/lib/schemas/contest-ops";

/**
 * Admin contest operations endpoints. Keep every path here so a backend route
 * rename is a one-file change.
 */
export function contestStaffPath(contestId: string): string {
  return `/api/v1/admin/contests/${contestId}/staff`;
}

export function addContestStaff(
  contestId: string,
  input: ContestStaffInviteInput,
): Promise<ContestStaffView> {
  return apiPost<ContestStaffView>(contestStaffPath(contestId), input);
}

export function removeContestStaff(
  contestId: string,
  staffId: string,
): Promise<{ removed: boolean }> {
  return apiDelete<{ removed: boolean }>(
    `${contestStaffPath(contestId)}/${staffId}`,
  );
}

export function addContestStaffNote(
  contestId: string,
  input: ContestStaffNoteInput,
): Promise<ContestStaffNoteView> {
  return apiPost<ContestStaffNoteView>(
    `/api/v1/admin/contests/${contestId}/notes`,
    input,
  );
}

export function proposeContestCandidate(
  contestId: string,
  input: ContestCandidateInput,
): Promise<ContestProblemCandidateView> {
  return apiPost<ContestProblemCandidateView>(
    `/api/v1/admin/contests/${contestId}/candidates`,
    input,
  );
}

export function decideContestCandidate(
  contestId: string,
  candidateId: string,
  status: "SHORTLISTED" | "REJECTED",
): Promise<{ status: "SHORTLISTED" | "REJECTED" }> {
  return apiPatch<{ status: "SHORTLISTED" | "REJECTED" }>(
    `/api/v1/admin/contests/${contestId}/candidates/${candidateId}`,
    { status },
  );
}

export function reviewContestSponsorship(
  contestId: string,
  sponsorId: string,
  decision: "APPROVED" | "REJECTED",
  note: string,
): Promise<{ sponsorId: string; status: "APPROVED" | "REJECTED" }> {
  return apiPatch<{ sponsorId: string; status: "APPROVED" | "REJECTED" }>(
    `/api/v1/admin/contests/${contestId}/sponsors/${sponsorId}`,
    { decision, note },
  );
}

export type EnsureSeriesResult = {
  created: boolean;
  contestId: string;
  startAt: string;
};

export function ensureContestSeries(): Promise<EnsureSeriesResult> {
  return apiPost<EnsureSeriesResult>(
    "/api/v1/admin/contest-series/ensure",
    {},
  );
}
