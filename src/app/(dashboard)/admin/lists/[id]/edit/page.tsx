import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StudyListForm } from "@/components/admin/study-list-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  listProblemOptionsByIds,
  listPublishedProblemOptions,
} from "@/server/services/problem-options";
import { getAdminStudyList } from "@/server/services/study-lists";

export const metadata: Metadata = { title: "Edit study list" };

export default async function EditStudyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initial = await getAdminStudyList(id);
  if (!initial) notFound();

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curated practice"
        title={initial.title}
        description="Update the details, sections and ordered problem path."
        actions={
          <Link
            href="/admin/lists"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <StudyListForm initial={initial} options={options} />
    </div>
  );
}
