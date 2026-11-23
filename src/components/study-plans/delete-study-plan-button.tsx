"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiDelete } from "@/lib/api-client";

export function DeleteStudyPlanButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (deleting) return;
    const confirmed = window.confirm(
      `Delete “${title}”? The plan and every note inside it will be removed. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiDelete(`/api/v1/lists/${encodeURIComponent(slug)}`);
      toast({
        title: "Plan deleted",
        description: `“${title}” and its notes were removed.`,
        variant: "success",
      });
      router.push("/lists");
      router.refresh();
    } catch (requestError) {
      toast({
        title: "Could not delete the plan",
        description:
          requestError instanceof ApiClientError
            ? requestError.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 text-destructive hover:text-destructive"
      onClick={() => void remove()}
      disabled={deleting}
      aria-busy={deleting}
    >
      {deleting ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
      {deleting ? "Deleting…" : "Delete plan"}
    </Button>
  );
}
