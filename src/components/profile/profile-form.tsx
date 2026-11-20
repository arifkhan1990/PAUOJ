"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import { profileSchema } from "@/lib/schemas/auth";

export function ProfileForm({
  displayName: initialDisplayName,
  bio: initialBio,
  country: initialCountry,
  institution: initialInstitution,
}: {
  displayName: string;
  bio: string | null;
  country: string | null;
  institution: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [institution, setInstitution] = useState(initialInstitution ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = profileSchema.safeParse({ displayName, bio, country, institution });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      await apiPatch("/api/v1/users/me", parsed.data);
      toast({ title: "Profile updated", variant: "success" });
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not update your profile.";
      setError(message);
      toast({ title: "Update failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={64}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          maxLength={64}
          placeholder="e.g. Bangladesh"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="institution">Institution</Label>
        <Input
          id="institution"
          value={institution}
          onChange={(event) => setInstitution(event.target.value)}
          maxLength={120}
          placeholder="University, college or company"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="A short introduction shown on your profile."
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {bio.length}/500
        </p>
      </div>
      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Save profile
      </Button>
    </form>
  );
}
