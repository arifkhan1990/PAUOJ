"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ContestRegisterButton({
  slug,
  registered,
  canRegister,
  isAuthenticated,
  ended,
  size,
  className,
}: {
  slug: string;
  registered: boolean;
  canRegister: boolean;
  isAuthenticated: boolean;
  ended: boolean;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (registered) {
    return (
      <Badge
        variant="success"
        className={cn("h-9 gap-1.5 px-3 text-sm", className)}
      >
        <CheckCircle2 className="size-4" /> Registered
      </Badge>
    );
  }
  if (ended) return null;
  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/contests/${slug}`)}`}
        className={cn(buttonVariants({ size }), className)}
      >
        <UserPlus className="size-4" /> Sign in to register
      </Link>
    );
  }
  if (!canRegister) return null;

  const register = async () => {
    setLoading(true);
    try {
      await apiPost(`/api/v1/contests/${slug}/register`, {});
      toast({ title: "You are registered", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not register",
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
      size={size}
      className={className}
      onClick={() => void register()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <UserPlus className="size-4" />
      )}
      Register for contest
    </Button>
  );
}
