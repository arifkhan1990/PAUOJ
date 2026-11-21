import type { Metadata } from "next";
import { InviteResume } from "@/features/assessments/invite-resume";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Absolute so the root `%s · PAU OJ` template does not repeat the app name.
  title: { absolute: "Assessment invite · PAU OJ" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AssessmentInviteResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Card className="p-6 sm:p-8">
        <InviteResume slug={slug} />
      </Card>
    </div>
  );
}
