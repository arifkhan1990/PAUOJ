"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContestShareButton({
  slug,
  title,
  className,
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const share = async () => {
    if (pending) return;
    setPending(true);
    const url = `${window.location.origin}/contests/${encodeURIComponent(slug)}`;
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title,
            text: `Join ${title} on PAU OJ`,
            url,
          });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
        }
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: "Contest link copied",
        description: url,
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not share this contest",
        description: "Copy the address from your browser instead.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void share()}
      disabled={pending}
      aria-busy={pending}
      aria-label={`Share contest: ${title}`}
      className={cn("h-11 justify-start gap-2", className)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      Share contest
    </Button>
  );
}
