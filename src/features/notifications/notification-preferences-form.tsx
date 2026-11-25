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

type BooleanPreferenceKey = {
  [Key in keyof NotificationPreferences]: NotificationPreferences[Key] extends boolean
    ? Key
    : never;
}[keyof NotificationPreferences];

type PreferenceOption = {
  key: BooleanPreferenceKey;
  label: string;
  description: string;
};

const IN_APP_OPTIONS: PreferenceOption[] = [
  {
    key: "notifyMessages",
    label: "Direct messages",
    description: "Show activity and unread badges for new messages.",
  },
  {
    key: "notifyFollows",
    label: "Follow activity",
    description: "Show follow requests and new followers.",
  },
  {
    key: "notifyMarketing",
    label: "Contest & course news",
    description: "Show in-app notices for new contests and learning modules.",
  },
];

const EMAIL_OPTIONS: PreferenceOption[] = [
  {
    key: "emailAccount",
    label: "Account & welcome",
    description: "A welcome note when you create your account.",
  },
  {
    key: "emailVerdicts",
    label: "Verdicts",
    description: "When a submission finishes judging.",
  },
  {
    key: "emailContests",
    label: "Contests",
    description: "Registration, start reminders and results.",
  },
  {
    key: "emailClarifications",
    label: "Clarifications",
    description: "Answers to your questions and new contest questions.",
  },
  {
    key: "emailReviews",
    label: "Reviews",
    description: "Problem changes, contest-use requests and review decisions.",
  },
  {
    key: "emailLearning",
    label: "Learning & payments",
    description: "Enrollment, payment approval and module reminders.",
  },
  {
    key: "emailAchievements",
    label: "Badges & milestones",
    description: "Achievements, rating jumps and streaks.",
  },
  {
    key: "emailAnnouncements",
    label: "Announcements",
    description: "Important platform notices from the team.",
  },
  {
    key: "emailMarketing",
    label: "Product news",
    description: "New contests, courses and feature launches.",
  },
  {
    key: "emailDiscussions",
    label: "Discussions",
    description: "Replies in discussions you follow.",
  },
  {
    key: "emailMessages",
    label: "Message copies",
    description: "Email a copy of each new direct message.",
  },
  {
    key: "emailFollows",
    label: "Follow activity",
    description: "Email follow requests and acceptances.",
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailVerdicts: true,
  emailContests: true,
  emailClarifications: true,
  emailReviews: true,
  emailAccount: true,
  emailLearning: true,
  emailAchievements: true,
  emailAnnouncements: true,
  emailMarketing: true,
  emailDiscussions: true,
  emailMessages: true,
  emailFollows: true,
  notifyMessages: true,
  notifyFollows: true,
  notifyMarketing: true,
  reviewEmailFrequency: "INSTANT",
};

const BOOLEAN_KEYS = [
  ...IN_APP_OPTIONS,
  ...EMAIL_OPTIONS,
].map((option) => option.key);

function withDefaults(
  initial: Partial<NotificationPreferences>,
): NotificationPreferences {
  const preferences = { ...DEFAULT_PREFERENCES };
  for (const key of BOOLEAN_KEYS) {
    const value = initial[key];
    if (typeof value === "boolean") preferences[key] = value;
  }
  if (initial.reviewEmailFrequency) {
    preferences.reviewEmailFrequency = initial.reviewEmailFrequency;
  }
  return preferences;
}

function PreferenceSection({
  id,
  title,
  description,
  options,
  preferences,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  options: PreferenceOption[];
  preferences: NotificationPreferences;
  onChange: (key: BooleanPreferenceKey, checked: boolean) => void;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <div>
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {options.map((option) => (
          <li key={option.key}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
              <input
                type="checkbox"
                checked={preferences[option.key]}
                onChange={(event) => onChange(option.key, event.target.checked)}
                className="mt-0.5 size-5 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NotificationPreferencesForm({
  initial,
}: {
  initial: Partial<NotificationPreferences>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(() => withDefaults(initial));
  const [loading, setLoading] = useState(false);

  const update = (key: BooleanPreferenceKey, checked: boolean) => {
    setPreferences((current) => ({ ...current, [key]: checked }));
  };

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
    <div className="space-y-5">
      <PreferenceSection
        id="notifications-in-app"
        title="In-app"
        description="Alerts and badges inside the app."
        options={IN_APP_OPTIONS}
        preferences={preferences}
        onChange={update}
      />

      <PreferenceSection
        id="notifications-email"
        title="Email"
        description="Inbox copies of the activity you pick. Email requires a verified address."
        options={EMAIL_OPTIONS}
        preferences={preferences}
        onChange={update}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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
          Follow notices stay in-app only. Emails require a verified address.
        </p>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={loading}
          className="h-11 w-full sm:w-auto"
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
