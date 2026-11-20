import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContestForm } from "@/components/admin/contest-form";
import { getAdminContestDetail } from "@/server/services/admin-contests";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "Edit contest" };

export const dynamic = "force-dynamic";

export default async function EditContestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contest, options] = await Promise.all([
    getAdminContestDetail(id),
    listProblemOptions(),
  ]);
  if (!contest) notFound();
  return <ContestForm initial={contest} options={options} />;
}
