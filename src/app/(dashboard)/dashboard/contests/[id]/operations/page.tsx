import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContestOperationsView } from "@/components/admin/contest-ops/contest-operations-view";
import { crewStatusFor } from "@/server/services/contest-context";
import { getContestOperationsDetail } from "@/server/services/contest-operations-queries";
import { assertContestCrewAccess } from "@/server/services/contest-access";
import { listProblemOptions } from "@/server/services/problem-options";
import { getCurrentUser } from "@/server/auth/session";
import type { SelectOption } from "@/lib/select-options";

export const metadata: Metadata = { title: "Contest crew workspace" };

export const dynamic = "force-dynamic";

export default async function CrewContestOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/dashboard/contests/${id}/operations`)}`,
    );
  }

  try {
    await assertContestCrewAccess(id, user);
  } catch {
    notFound();
  }

  const [detail, crew, problems] = await Promise.all([
    getContestOperationsDetail(id).catch(() => null),
    crewStatusFor(id, user.id),
    listProblemOptions(),
  ]);
  if (!detail) notFound();

  const isAdmin = user.role === "ADMIN";
  const role = crew?.role ?? null;
  const isDirector = role === "DIRECTOR";
  const problemOptions: SelectOption[] = problems.map((problem) => ({
    value: problem.id,
    label: problem.title,
    description: `${problem.difficulty} · ${problem.slug}`,
  }));

  return (
    <ContestOperationsView
      contestId={id}
      detail={detail}
      problemOptions={problemOptions}
      basePath="/dashboard"
      canEdit={false}
      canManageCrew={isAdmin || isDirector}
      canDecideCandidates={isAdmin || isDirector}
      canProposeCandidate={isAdmin || isDirector || role === "SETTER"}
      canReviewSponsors={isAdmin}
    />
  );
}
