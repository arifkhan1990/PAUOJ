import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { UserStudyListForm } from "@/components/study-plans/user-study-list-form";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { listPublishedProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = {
  title: "Create a study plan",
  description:
    "Build a private, sectioned study plan from published problems and track your progress.",
};

export const dynamic = "force-dynamic";

export default async function NewStudyPlanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/lists/new")}`);
  }

  const options = await listPublishedProblemOptions();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Private practice"
        title="Create a study plan"
        description="Pick published problems, group them into sections and keep the plan to yourself. You can edit or delete it any time."
        actions={
          <Link
            href="/lists"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to plans
          </Link>
        }
      />
      <div className="mt-6">
        <UserStudyListForm initial={null} options={options} />
      </div>
    </div>
  );
}
