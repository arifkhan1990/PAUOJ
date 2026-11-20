import type { Metadata } from "next";
import { ProblemForm } from "@/components/admin/problem-form";

export const metadata: Metadata = { title: "New problem" };

export default function NewTeacherProblemPage() {
  return <ProblemForm initial={null} basePath="/teacher/problems" />;
}
