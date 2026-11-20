"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function RejudgeButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const rejudge = async () => {
    if (
      !window.confirm(
        "Rejudge this submission? It will run against the current tests.",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await apiPost(`/api/v1/admin/submissions/${submissionId}/rejudge`, {});
      toast({ title: "Rejudge queued", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not rejudge",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void rejudge()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Rejudge
    </Button>
  );
}
