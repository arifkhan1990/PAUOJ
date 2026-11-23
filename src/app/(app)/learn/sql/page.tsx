import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SqlLab } from "@/features/sql-lab/sql-lab";
import { getCurrentUser } from "@/server/auth/session";
import { getEntitledModuleSlugs } from "@/server/services/learning-payments";
import { getSqlLabProgress } from "@/server/services/sql-lab";

export const metadata: Metadata = {
  title: "SQL Labs",
  description:
    "Practise SQL against the TechNest multi-vendor marketplace: vendor reports, order totals, window functions and revenue timelines.",
};

export const dynamic = "force-dynamic";

export default async function SqlLabPage() {
  const user = await getCurrentUser();
  const [entitled, completed] = await Promise.all([
    getEntitledModuleSlugs(user?.id ?? null, user?.role),
    user ? getSqlLabProgress(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All learning tracks
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="SQL Labs"
          title="Query a real marketplace"
          description="Write SQL against the TechNest multi-vendor shop: vendors, products, orders and line items. Every task runs on a fresh copy of the dataset and shows the exact rows a dashboard would use."
        />
      </div>

      <div className="mt-6">
        <SqlLab
          completed={completed}
          advancedUnlocked={entitled.has("advanced-sql")}
          signedIn={Boolean(user)}
        />
      </div>
    </div>
  );
}
