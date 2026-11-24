import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContestOperationsView } from "@/components/admin/contest-ops/contest-operations-view";
import { getAdminContestDetail } from "@/server/services/admin-contests";
import { getContestOperationsDetail } from "@/server/services/contest-operations-queries";
import { listProblemOptions } from "@/server/services/problem-options";
import type { SelectOption } from "@/lib/select-options";

export const metadata: Metadata = { title: "Contest operations" };

export const dynamic = "force-dynamic";

export default async function ContestOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [operations, contest] = await Promise.all([
    getContestOperationsDetail(id).catch(() => null),
    getAdminContestDetail(id),
  ]);
  if (!operations || !contest) notFound();

  const problems = await listProblemOptions();
  const problemOptions: SelectOption[] = problems.map((problem) => ({
    value: problem.id,
    label: problem.title,
    description: `${problem.difficulty} · ${problem.slug}`,
  }));

  return (
    <ContestOperationsView
      contestId={id}
      detail={operations}
      problemOptions={problemOptions}
    />
  );
}
