import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContestForm } from "@/components/admin/contest-form";
import { requireTeacher } from "@/server/auth/guards";
import { getAdminContestDetail } from "@/server/services/admin-contests";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "Edit contest" };

export const dynamic = "force-dynamic";

export default async function EditTeacherContestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const ownerId = teacher.id;
  const [contest, options] = await Promise.all([
    getAdminContestDetail(id, ownerId),
    listProblemOptions(ownerId),
  ]);
  if (!contest) notFound();
  return (
    <ContestForm
      initial={contest}
      options={options}
      basePath="/teacher/contests"
    />
  );
}
