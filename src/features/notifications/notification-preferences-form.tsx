"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import type { NotificationPreferences } from "@/lib/notification-types";

const OPTIONS = [
  {
    key: "notifyMessages" as const,
    label: "In-app message notifications",
    description: "Show activity and unread badges for new direct messages.",
  },
  {
    key: "notifyFollows" as const,
    label: "Follow request notifications",
    description: "Show activity when someone asks to follow you.",
  },
  {
    key: "emailVerdicts" as const,
    label: "Verdict emails",
    description: "Receive an email when a submission finishes judging.",
  },
  {
    key: "emailContests" as const,
    label: "Contest emails",
    description: "Receive a reminder when a contest you registered for starts.",
  },
  {
    key: "emailClarifications" as const,
    label: "Clarification emails",
    description:
      "Receive an email when your contest question is answered or a new question arrives.",
  },
  {
    key: "emailReviews" as const,
    label: "Review emails",
    description:
      "Receive an email when a problem change or contest-use request needs your review, or when your review request is decided.",
  },
];

export function NotificationPreferencesForm({
  initial,
}: {
  initial: NotificationPreferences;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(initial);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await apiPatch("/api/v1/users/me/notifications", preferences);
      toast({ title: "Notification preferences saved", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not save preferences",
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
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {OPTIONS.map((option) => (
          <li
            key={option.key}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={preferences[option.key]}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    [option.key]: event.target.checked,
                  }))
                }
                className="size-5 rounded border-border accent-primary"
              />
              <span className="sr-only">{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label htmlFor="reviewEmailFrequency">Review email frequency</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Instant sends each review event. Hourly and daily group them into one
            digest email.
          </p>
        </div>
        <SearchableSelect
          id="reviewEmailFrequency"
          value={preferences.reviewEmailFrequency}
          disabled={!preferences.emailReviews}
          onValueChange={(next) =>
            setPreferences((current) => ({
              ...current,
              reviewEmailFrequency:
                next as NotificationPreferences["reviewEmailFrequency"],
            }))
          }
          className="w-full sm:w-48"
          options={[
            { value: "INSTANT", label: "Instant" },
            { value: "HOURLY", label: "Hourly digest" },
            { value: "DAILY", label: "Daily digest" },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          In-app message and follow notifications can be turned off above.
          Emails require a verified address.
        </p>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={loading}
          className="h-11"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
