"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiDelete } from "@/lib/api-client";

export function DeleteResourceButton({
  slug,
  resourceId,
}: {
  slug: string;
  resourceId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (deleting || !window.confirm("Delete this resource?")) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/v1/problems/${slug}/resources/${resourceId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not delete the resource",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
      onClick={() => void remove()}
      disabled={deleting}
    >
      {deleting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
      Delete
    </Button>
  );
}
