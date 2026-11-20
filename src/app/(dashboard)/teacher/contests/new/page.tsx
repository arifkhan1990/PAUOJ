import type { Metadata } from "next";
import { ContestForm } from "@/components/admin/contest-form";
import { requireTeacher } from "@/server/auth/guards";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "New contest" };

export const dynamic = "force-dynamic";

export default async function NewTeacherContestPage() {
  const teacher = await requireTeacher();
  const options = await listProblemOptions(
    teacher.id,
  );
  return (
    <ContestForm
      initial={null}
      options={options}
      basePath="/teacher/contests"
    />
  );
}
