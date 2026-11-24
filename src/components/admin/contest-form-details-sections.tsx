"use client";

import { UserRound, UsersRound } from "lucide-react";
import { MarkdownField } from "@/components/admin/markdown-field";
import { SectionCard } from "@/components/admin/contest-form-sections";
import type {
  ContestFormUpdate,
  ContestFormValues,
} from "@/components/admin/contest-form-values";
import { BannerUrlField } from "@/components/shared/banner-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CONTEST_HOSTING_FEE_MAX,
  CONTEST_HOSTING_FEE_MIN,
} from "@/lib/contest-ops";

export function ContestDetailsSection({
  values,
  update,
}: {
  values: ContestFormValues;
  update: ContestFormUpdate;
}) {
  return (
    <SectionCard
      title="Public page content"
      description="The banner fills the contest hero. Eligibility, rules and prizes each render in their own public section — About, Rules & policy and Prizes — never in a sidebar. Leave a field blank to hide its block."
    >
      <BannerUrlField
        value={values.bannerUrl}
        onChange={(value) => update("bannerUrl", value)}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <MarkdownField
          id="eligibility"
          label="Eligibility"
          hint="Renders in the public About section: who can register, team rules, division limits."
          value={values.eligibility}
          onChange={(value) => update("eligibility", value)}
          rows={4}
          placeholder="Who can register, team rules, division limits."
        />
        <MarkdownField
          id="prizes"
          label="Prizes"
          hint="Renders in the public Prizes section: pool, certificates or sponsor goodies."
          value={values.prizes}
          onChange={(value) => update("prizes", value)}
          rows={4}
          placeholder="Prize pool, certificates or sponsor goodies."
        />
        <MarkdownField
          id="rules"
          label="Rules"
          hint="Renders in the public Rules & policy section: scoring, penalty, plagiarism and conduct."
          value={values.rules}
          onChange={(value) => update("rules", value)}
          rows={5}
          placeholder="Scoring, penalty, plagiarism and conduct rules."
          className="lg:col-span-2"
        />
      </div>
    </SectionCard>
  );
}

export function ContestFeeSection({
  values,
  update,
}: {
  values: ContestFormValues;
  update: ContestFormUpdate;
}) {
  return (
    <SectionCard
      title="Arrangement fee"
      description={`Optional fee for community-hosted private contests (৳${CONTEST_HOSTING_FEE_MIN.toLocaleString("en-US")}–৳${CONTEST_HOSTING_FEE_MAX.toLocaleString("en-US")}). Leave blank for official or free rounds.`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="feeBdt">Fee (BDT)</Label>
          <Input
            id="feeBdt"
            type="number"
            inputMode="numeric"
            min={CONTEST_HOSTING_FEE_MIN}
            max={CONTEST_HOSTING_FEE_MAX}
            step="500"
            value={values.feeBdt}
            onChange={(event) => update("feeBdt", event.target.value)}
            placeholder="No fee"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="feeReference">Payment reference</Label>
          <Input
            id="feeReference"
            value={values.feeReference}
            onChange={(event) => update("feeReference", event.target.value)}
            placeholder="Payment TrxID"
            maxLength={120}
          />
          <p className="text-[11px] text-muted-foreground">
            Stored for admin reconciliation only.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

export function ParticipantFormatHint({ format }: { format: string }) {
  if (format === "GROUP") {
    return (
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <UsersRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Team rounds use one shared submission slot per team. Virtual replay is
          disabled for team contests and no rating change is applied.
        </span>
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
      <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Solo rounds follow individual ICPC ranking and are rated when the
        contest is official and public.
      </span>
    </p>
  );
}
