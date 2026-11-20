"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function ResendVerificationButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resend = async () => {
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/resend-verification", {});
      toast({
        title: "Verification email sent",
        description: "Check your inbox and spam folder.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not send the email",
        description:
          error instanceof ApiClientError ? error.message : "Please try again.",
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
      onClick={() => void resend()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MailCheck className="size-3.5" />
      )}
      Resend verification
    </Button>
  );
}
