"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

function readInviteToken(slug: string): string | null {
  try {
    return sessionStorage.getItem(`pauoj:invite:${slug}`);
  } catch {
    return null;
  }
}

export function InviteResume({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"resolving" | "missing">("resolving");

  useEffect(() => {
    const token = readInviteToken(slug);
    if (!token) {
      setState("missing");
      return;
    }
    router.replace(`/assessments/${slug}/invite/${token}`);
  }, [router, slug]);

  if (state === "resolving") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening your invite…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <MailCheck className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">Invite link needed</h2>
      <p className="text-sm text-muted-foreground">
        Open the personal invite link from your instructor.
      </p>
      <Link
        href={`/assessments/${slug}`}
        className={`${buttonVariants({ variant: "outline" })} mt-2`}
      >
        Back to the assessment
      </Link>
    </div>
  );
}
