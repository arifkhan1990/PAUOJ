"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function AssessmentFinishButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const finish = async () => {
    if (
      !window.confirm(
        "Finish the assessment now? You will not be able to submit more solutions.",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await apiPost(`/api/v1/assessments/${slug}/finish`, {});
      toast({ title: "Assessment finished", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not finish",
        description:
          error instanceof ApiClientError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={() => void finish()} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCheck className="size-4" />
      )}
      Finish assessment
    </Button>
  );
}
