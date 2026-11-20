"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function FinishVirtualContestButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    if (!window.confirm("Finish this virtual contest now?")) return;
    setLoading(true);
    try {
      await apiPost(`/api/v1/contests/${slug}/virtual/finish`, {});
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not finish the virtual contest",
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
    <Button type="button" variant="destructive" size="sm" onClick={() => void finish()} disabled={loading}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />}
      Finish
    </Button>
  );
}
