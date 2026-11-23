import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteStudyPlanButton } from "@/components/study-plans/delete-study-plan-button";
import { UserStudyListForm } from "@/components/study-plans/user-study-list-form";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth/guards";
import {
  listProblemOptionsByIds,
  listPublishedProblemOptions,
} from "@/server/services/problem-options";
import { getUserStudyListForEdit } from "@/server/services/study-lists";

export const metadata: Metadata = {
  title: "Edit study plan",
  description: "Update your private study plan, its sections and its problems.",
};

export const dynamic = "force-dynamic";

export default async function EditStudyPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser(`/lists/${slug}/edit`);
  const initial = await getUserStudyListForEdit(slug, user.id);
  if (!initial) notFound();
  // Public plans are managed from the admin workspace; this form forces private.
  if (initial.isPublic) redirect(`/admin/lists/${initial.id}/edit`);

  const options = await listPublishedProblemOptions();
  const known = new Set(options.map((option) => option.id));
  const storedIds = initial.sections
    .flatMap((section) => section.problemIds)
    .filter((problemId) => !known.has(problemId));
  const stored = await listProblemOptionsByIds(storedIds);
  if (stored.length > 0) {
    options.push(...stored);
    options.sort((left, right) => left.title.localeCompare(right.title));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Private practice"
        title={initial.title}
        description="Update the details, sections and ordered problem path. The plan stays private."
        actions={
          <>
            <Link
              href={`/lists/${initial.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to plan
            </Link>
            <DeleteStudyPlanButton slug={initial.slug} title={initial.title} />
          </>
        }
      />
      <div className="mt-6">
        <UserStudyListForm initial={initial} options={options} />
      </div>
    </div>
  );
}
