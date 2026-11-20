"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function VirtualContestButton({
  slug,
  label = "Start virtual contest",
}: {
  slug: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      await apiPost(`/api/v1/contests/${slug}/virtual`, {});
      router.push(`/contests/${slug}/virtual`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not start the virtual contest",
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
    <Button type="button" variant="outline" onClick={() => void start()} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
      {label}
    </Button>
  );
}
