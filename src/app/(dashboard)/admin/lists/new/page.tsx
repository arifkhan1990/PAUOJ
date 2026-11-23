import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StudyListForm } from "@/components/admin/study-list-form";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { listPublishedProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "New study list" };

export default async function NewStudyListPage() {
  const options = await listPublishedProblemOptions();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curated practice"
        title="New study list"
        description="Choose a title, level and the sectioned problem path."
        actions={
          <Link
            href="/admin/lists"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <StudyListForm initial={null} options={options} />
    </div>
  );
}
