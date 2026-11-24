"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import {
  ContestField,
  contestFieldDescribedBy,
} from "@/features/contests/contest-field";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  CONTEST_SPONSOR_TIER_LABEL,
  CONTEST_SPONSOR_TIERS,
  type ContestSponsorTier,
} from "@/lib/contest-ops";
import { contestSponsorRequestSchema } from "@/lib/schemas/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { cn } from "@/lib/utils";

const TIER_DESCRIPTION: Record<ContestSponsorTier, string> = {
  TITLE: "Hero strip above the contest header.",
  GOLD: "Partner grid with gold tier styling.",
  SILVER: "Partner grid with silver tier styling.",
  COMMUNITY: "Partner grid for community partners.",
};

const TIER_OPTIONS: SelectOption[] = CONTEST_SPONSOR_TIERS.map((tier) => ({
  value: tier,
  label: CONTEST_SPONSOR_TIER_LABEL[tier],
  description: TIER_DESCRIPTION[tier],
}));

type SponsorFormValues = {
  name: string;
  tier: ContestSponsorTier;
  websiteUrl: string;
  logoUrl: string;
  message: string;
  amountBdt: string;
};

const INITIAL_VALUES: SponsorFormValues = {
  name: "",
  tier: "GOLD",
  websiteUrl: "",
  logoUrl: "",
  message: "",
  amountBdt: "",
};

const FIELD_IDS = [
  "sponsor-name",
  "sponsor-tier",
  "sponsor-website",
  "sponsor-logo",
  "sponsor-message",
  "sponsor-amount",
] as const;

const FIELD_PATH = {
  "sponsor-name": "name",
  "sponsor-tier": "tier",
  "sponsor-website": "websiteUrl",
  "sponsor-logo": "logoUrl",
  "sponsor-message": "message",
  "sponsor-amount": "amountBdt",
} as const;

export function SponsorRequestForm({ slug }: { slug: string }) {
  const { toast } = useToast();
  const [values, setValues] = useState<SponsorFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; status: "PENDING" } | null>(
    null,
  );

  const update = <K extends keyof SponsorFormValues>(
    key: K,
    value: SponsorFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const amount = values.amountBdt.trim();

    const parsed = contestSponsorRequestSchema.safeParse({
      name: values.name,
      tier: values.tier,
      websiteUrl: values.websiteUrl,
      logoUrl: values.logoUrl,
      message: values.message,
      amountBdt: amount ? Number(amount) : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstId = FIELD_IDS.find((id) => fieldErrors[FIELD_PATH[id]]);
      if (firstId) document.getElementById(firstId)?.focus();
      return;
    }

    setLoading(true);
    try {
      const created = await apiPost<{ id: string; status: "PENDING" }>(
        `/api/v1/contests/${encodeURIComponent(slug)}/sponsors`,
        parsed.data,
      );
      setResult(created);
      toast({
        title: "Sponsorship request sent",
        description: "The contest team will review it before it appears.",
        variant: "success",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not send the sponsorship request.";
      setFormError(message);
      toast({ title: "Request failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Card className="p-6">
        <span className="grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Request received</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your sponsorship is pending review. Approved sponsors are highlighted
          on the contest page — title sponsors get the hero strip.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Request reference</p>
        <code className="mt-1 block break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
          {result.id}
        </code>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/contests/${slug}`}
            className={cn(buttonVariants(), "h-11")}
          >
            Back to contest
          </Link>
          <Link
            href="/contests"
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            All contests
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {formError}
        </div>
      ) : null}

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold">Sponsor details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every request is reviewed by the contest team before it appears
            publicly.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ContestField
            id="sponsor-name"
            label="Sponsor name"
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              id="sponsor-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={80}
              autoFocus
              autoComplete="organization"
              placeholder="Company or community name"
              className="h-11"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={contestFieldDescribedBy(
                "sponsor-name",
                errors.name,
              )}
            />
          </ContestField>
          <ContestField id="sponsor-tier" label="Tier" error={errors.tier}>
            <SearchableSelect
              id="sponsor-tier"
              value={values.tier}
              onValueChange={(next) =>
                update("tier", next as ContestSponsorTier)
              }
              options={TIER_OPTIONS}
              className="h-11"
              aria-describedby={contestFieldDescribedBy(
                "sponsor-tier",
                errors.tier,
              )}
            />
          </ContestField>
          <ContestField
            id="sponsor-amount"
            label="Amount (BDT, optional)"
            hint="Shown to the contest team only."
            error={errors.amountBdt}
          >
            <Input
              id="sponsor-amount"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={values.amountBdt}
              onChange={(event) => update("amountBdt", event.target.value)}
              placeholder="e.g. 10000"
              className="h-11"
              aria-invalid={errors.amountBdt ? true : undefined}
              aria-describedby={contestFieldDescribedBy(
                "sponsor-amount",
                errors.amountBdt,
                "Shown to the contest team only.",
              )}
            />
          </ContestField>
          <ContestField
            id="sponsor-website"
            label="Website (optional)"
            hint="A public https:// URL."
            error={errors.websiteUrl}
          >
            <Input
              id="sponsor-website"
              type="url"
              value={values.websiteUrl}
              onChange={(event) => update("websiteUrl", event.target.value)}
              maxLength={300}
              autoComplete="url"
              placeholder="https://example.com"
              className="h-11"
              aria-invalid={errors.websiteUrl ? true : undefined}
              aria-describedby={contestFieldDescribedBy(
                "sponsor-website",
                errors.websiteUrl,
                "A public https:// URL.",
              )}
            />
          </ContestField>
          <ContestField
            id="sponsor-logo"
            label="Logo URL (optional)"
            hint="Public https:// image. Without one we show your initials."
            error={errors.logoUrl}
          >
            <Input
              id="sponsor-logo"
              type="url"
              value={values.logoUrl}
              onChange={(event) => update("logoUrl", event.target.value)}
              maxLength={500}
              placeholder="https://example.com/logo.png"
              className="h-11"
              aria-invalid={errors.logoUrl ? true : undefined}
              aria-describedby={contestFieldDescribedBy(
                "sponsor-logo",
                errors.logoUrl,
                "Public https:// image. Without one we show your initials.",
              )}
            />
          </ContestField>
          <ContestField
            id="sponsor-message"
            label="Message (optional)"
            hint="One or two lines shown next to your name."
            error={errors.message}
            className="sm:col-span-2"
          >
            <Textarea
              id="sponsor-message"
              value={values.message}
              onChange={(event) => update("message", event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Why are you supporting this round?"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={contestFieldDescribedBy(
                "sponsor-message",
                errors.message,
                "One or two lines shown next to your name.",
              )}
            />
          </ContestField>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <BadgeCheck
            className="mt-px size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>
            Approved sponsors appear only on this contest. We never publish
            pending requests, and your amount is visible to the contest team
            only.
          </span>
        </p>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Sparkles
            className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span>
            Title sponsors get a distinct hero strip above the contest header;
            gold, silver and community partners appear in the partner grid.
          </span>
        </p>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ImageIcon
            className="mt-px size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>
            Logos load from your public URL. If the link is broken or missing we
            use your initials instead — no placeholder logos.
          </span>
        </p>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="h-11" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {loading ? "Sending…" : "Send sponsorship request"}
        </Button>
      </div>
    </form>
  );
}
