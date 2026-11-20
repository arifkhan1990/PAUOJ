import type { Metadata } from "next";
import { ContestForm } from "@/components/admin/contest-form";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "New contest" };

export const dynamic = "force-dynamic";

export default async function NewContestPage() {
  const options = await listProblemOptions();
  return <ContestForm initial={null} options={options} />;
}
