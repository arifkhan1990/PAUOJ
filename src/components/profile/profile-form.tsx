"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import {
  MAX_PHONE_INPUT_LENGTH,
  MAX_PROFILE_SKILLS,
  TSHIRT_SIZE_OPTIONS,
  USER_STATUS_OPTIONS,
  type TshirtSize,
  type UserCurrentStatus,
} from "@/lib/profile-fields";
import { profileSchema } from "@/lib/schemas/auth";

const STATUS_OPTIONS = [{ value: "", label: "Not set" }, ...USER_STATUS_OPTIONS];
const TSHIRT_OPTIONS = [
  { value: "", label: "Not set" },
  ...TSHIRT_SIZE_OPTIONS,
];

export type ProfileFormProps = {
  displayName: string;
  bio: string | null;
  country: string | null;
  institution: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  address: string | null;
  phone: string | null;
  currentStatus: UserCurrentStatus | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: string[];
  tshirtSize: TshirtSize | null;
};

export function ProfileForm({
  displayName: initialDisplayName,
  bio: initialBio,
  country: initialCountry,
  institution: initialInstitution,
  website: initialWebsite,
  github: initialGithub,
  linkedin: initialLinkedin,
  address: initialAddress,
  phone: initialPhone,
  currentStatus: initialStatus,
  companyName: initialCompanyName,
  jobTitle: initialJobTitle,
  skills: initialSkills,
  tshirtSize: initialTshirtSize,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [institution, setInstitution] = useState(initialInstitution ?? "");
  const [website, setWebsite] = useState(initialWebsite ?? "");
  const [github, setGithub] = useState(initialGithub ?? "");
  const [linkedin, setLinkedin] = useState(initialLinkedin ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [status, setStatus] = useState<string>(initialStatus ?? "");
  const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [skillsInput, setSkillsInput] = useState(initialSkills.join(", "));
  const [tshirtSize, setTshirtSize] = useState<string>(
    initialTshirtSize ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = profileSchema.safeParse({
      displayName,
      bio,
      country,
      institution,
      website,
      github,
      linkedin,
      address,
      phone,
      currentStatus: status,
      companyName,
      jobTitle,
      skills: skillsInput
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      tshirtSize,
    });
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

      <fieldset className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-semibold">Work &amp; skills</legend>
        <p className="text-xs text-muted-foreground">
          Public details that help other coders know what you work on.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="currentStatus">Current status</Label>
          <SearchableSelect
            id="currentStatus"
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            searchable={false}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              maxLength={120}
              autoComplete="organization"
              placeholder="e.g. Grameenphone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              maxLength={120}
              autoComplete="organization-title"
              placeholder="e.g. Software Engineer"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills</Label>
          <Input
            id="skills"
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
            maxLength={400}
            placeholder="TypeScript, React, PostgreSQL"
          />
          <p className="text-[11px] text-muted-foreground">
            Up to {MAX_PROFILE_SKILLS} skills, separated by commas.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-semibold">Links</legend>
        <p className="text-xs text-muted-foreground">
          Optional and shown on your public profile. Paste a full URL or just
          your handle.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="text"
            inputMode="url"
            autoComplete="url"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            maxLength={200}
            placeholder="https://your-site.dev"
          />
          <p className="text-[11px] text-muted-foreground">
            Personal site, blog or portfolio.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={github}
              onChange={(event) => setGithub(event.target.value)}
              maxLength={200}
              placeholder="octocat"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground">
              Handle or profile URL.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
              maxLength={200}
              placeholder="your-name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground">
              Public profile name or URL.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-semibold">Private details</legend>
        <p className="text-xs text-muted-foreground">
          Phone, address and T-shirt size are visible only to you and admins.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={MAX_PHONE_INPUT_LENGTH}
            placeholder="+880 1712-345678 or 01712-345678"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            maxLength={200}
            autoComplete="street-address"
            placeholder="Street, city, postal code"
          />
        </div>
        <div className="space-y-1.5 sm:max-w-56">
          <Label htmlFor="tshirtSize">T-shirt size</Label>
          <SearchableSelect
            id="tshirtSize"
            value={tshirtSize}
            onValueChange={setTshirtSize}
            options={TSHIRT_OPTIONS}
            searchable={false}
          />
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="h-11">
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
