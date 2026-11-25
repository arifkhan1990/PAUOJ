import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import { UnsubscribeForm } from "@/features/notifications/unsubscribe-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUnsubscribeTarget } from "@/server/services/notifications";
import type { UnsubscribeScope } from "@/lib/notification-types";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

const SCOPES: UnsubscribeScope[] = [
  "all",
  "account",
  "verdicts",
  "contests",
  "clarifications",
  "reviews",
  "learning",
  "achievements",
  "announcements",
  "marketing",
  "discussions",
  "messages",
];

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const token = firstValue(query.token)?.slice(0, 200) ?? "";
  const rawScope = firstValue(query.scope);
  const scope = SCOPES.includes(rawScope as UnsubscribeScope)
    ? (rawScope as UnsubscribeScope)
    : "all";
  const target = token ? await getUnsubscribeTarget(token) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <MailX className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Email notifications
        </h1>
        {target ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Hi {target.displayName}. Choose whether to stop the selected
              notification emails. In-app notifications stay available.
            </p>
            <div className="mt-5">
              <UnsubscribeForm token={token} scope={scope} />
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              You can manage individual categories anytime in{" "}
              <Link
                href="/settings#notifications"
                className="font-medium text-primary hover:underline"
              >
                Settings
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              This unsubscribe link is invalid or has expired. Sign in and open
              Settings to manage your email preferences instead.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/settings#notifications"
                className={buttonVariants()}
              >
                Open settings
              </Link>
              <Link
                href="/"
                className={buttonVariants({ variant: "outline" })}
              >
                Home
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
