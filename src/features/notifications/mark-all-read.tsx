"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPatch } from "@/lib/api-client";

export function MarkAllReadButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const markRead = async () => {
    setLoading(true);
    try {
      await apiPatch("/api/v1/notifications/read", {});
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update notifications",
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
      size="sm"
      onClick={() => void markRead()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <CheckCheck className="size-3.5" />
      )}
      Mark all read
    </Button>
  );
}
