import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { requireTeacher } from "@/server/auth/guards";
import { getAdminProblemDetail } from "@/server/services/admin-problems";

export const metadata: Metadata = { title: "Edit problem" };

export const dynamic = "force-dynamic";

export default async function EditTeacherProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const ownerId = teacher.id;
  const problem = await getAdminProblemDetail(id, ownerId);
  if (!problem) notFound();
  return <ProblemForm initial={problem} basePath="/teacher/problems" />;
}
