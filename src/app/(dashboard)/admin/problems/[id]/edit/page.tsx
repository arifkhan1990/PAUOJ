import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { getAdminProblemDetail } from "@/server/services/admin-problems";

export const metadata: Metadata = { title: "Edit problem" };

export const dynamic = "force-dynamic";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = await getAdminProblemDetail(id);
  if (!problem) notFound();
  return <ProblemForm initial={problem} />;
}
