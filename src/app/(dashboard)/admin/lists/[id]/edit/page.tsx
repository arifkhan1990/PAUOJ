import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StudyListForm } from "@/components/admin/study-list-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listProblemOptions } from "@/server/services/problem-options";
import { getAdminStudyList } from "@/server/services/study-lists";

export const metadata: Metadata = { title: "Edit study list" };

export default async function EditStudyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [initial, options] = await Promise.all([
    getAdminStudyList(id),
    listProblemOptions(),
  ]);
  if (!initial) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curated practice"
        title={initial.title}
        description="Update the description, visibility or ordered problem set."
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
