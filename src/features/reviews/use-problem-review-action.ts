"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type { ProblemReviewActionResult } from "@/lib/problem-review-types";
import type { ProblemReviewActionInput } from "@/lib/schemas/problem-review";

type ActionFeedback = {
  successTitle:
    | string
    | ((result: ProblemReviewActionResult) => string);
  successDescription?: string;
};

export function useProblemReviewAction(problemId: string) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    input: ProblemReviewActionInput,
    feedback: ActionFeedback,
  ): Promise<ProblemReviewActionResult | null> => {
    if (pending) return null;
    setPending(true);
    setError(null);

    try {
      const result = await apiPost<ProblemReviewActionResult>(
        `/api/v1/problem-reviews/${problemId}`,
        input,
      );
      toast({
        title:
          typeof feedback.successTitle === "function"
            ? feedback.successTitle(result)
            : feedback.successTitle,
        description: feedback.successDescription,
        variant: "success",
      });
      router.refresh();
      return result;
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? cause.message
          : "The action could not be completed. Please try again.";
      setError(message);
      toast({ title: "Action failed", description: message, variant: "error" });
      return null;
    } finally {
      setPending(false);
    }
  };

  return {
    run,
    pending,
    error,
  };
}
