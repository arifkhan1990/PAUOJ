"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  LogIn,
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type PendingAction = "join" | "leave";

type EnrollmentResponse = { enrolled: boolean };

export function PlanActions({
  slug,
  signedIn,
  enrolled,
  completed,
}: {
  slug: string;
  signedIn: boolean;
  enrolled: boolean;
  completed: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    setIsEnrolled(enrolled);
  }, [enrolled]);

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/lists/${slug}`}
        className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
      >
        <LogIn aria-hidden="true" />
        Sign in to track progress
      </Link>
    );
  }

  const updateEnrollment = async (action: PendingAction) => {
    setPending(action);
    try {
      const path = `/api/v1/lists/${encodeURIComponent(slug)}/enroll`;
      const result =
        action === "join"
          ? await apiPost<EnrollmentResponse>(path, {})
          : await apiDelete<EnrollmentResponse>(path);
      setIsEnrolled(result.enrolled);
      toast({
        title: action === "join" ? "Plan started" : "Plan left",
        description:
          action === "join"
            ? "Progress on this plan is now tracked on your account."
            : "Solved problems stay on your account, so you can rejoin anytime.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title:
          action === "join"
            ? "Could not start this plan"
            : "Could not leave this plan",
        description:
          error instanceof ApiClientError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mt-4 space-y-2.5">
      {completed ? (
        <Badge variant="success" className="w-full justify-center py-1">
          <CheckCircle2 aria-hidden="true" />
          Plan completed
        </Badge>
      ) : null}

      {isEnrolled ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={() => void updateEnrollment("leave")}
          disabled={pending !== null}
          aria-busy={pending === "leave"}
        >
          {pending === "leave" ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <X aria-hidden="true" />
          )}
          {pending === "leave" ? "Leaving…" : "Leave plan"}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => void updateEnrollment("join")}
          disabled={pending !== null}
          aria-busy={pending === "join"}
        >
          {pending === "join" ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          {pending === "join" ? "Starting…" : "Start plan"}
        </Button>
      )}
    </div>
  );
}
