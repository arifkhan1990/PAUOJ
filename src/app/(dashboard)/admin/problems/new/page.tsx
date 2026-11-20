import type { Metadata } from "next";
import { ProblemForm } from "@/components/admin/problem-form";

export const metadata: Metadata = { title: "New problem" };

export default function NewProblemPage() {
  return <ProblemForm initial={null} />;
}
