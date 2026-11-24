"use client";

import {
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MarkdownField } from "@/components/admin/markdown-field";
import { Card } from "@/components/ui/card";
import { BannerUrlField } from "@/components/shared/banner-url-field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentMethodView } from "@/lib/learning/payment-types";
import {
  ContestField,
  contestFieldDescribedBy,
} from "@/features/contests/contest-field";
import {
  DIVISION_OPTIONS,
  FEE_OPTIONS,
  FORMAT_OPTIONS,
  TEAM_SIZE_OPTIONS,
  type HostFormErrors,
  type HostFormUpdate,
  type HostFormValues,
} from "@/features/contests/host-contest-values";
import {
  CONTEST_TEAM_MAX_SIZE,
  CONTEST_TEAM_MIN_SIZE,
  type ContestFormat,
} from "@/lib/contest-ops";
import type { ContestDivision } from "@/lib/types";

type SectionProps = {
  values: HostFormValues;
  errors: HostFormErrors;
  update: HostFormUpdate;
};

export function HostBasicsSection({ values, errors, update }: SectionProps) {
  const isGroup = values.format === "GROUP";

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold">Contest basics</h2>
      <ContestField id="title" label="Title" error={errors.title}>
        <Input
          id="title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          maxLength={120}
          autoFocus
          autoComplete="off"
          placeholder="e.g. Inter-department Team Sprint"
          className="h-11"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={contestFieldDescribedBy("title", errors.title)}
        />
      </ContestField>
      <BannerUrlField
        id="bannerUrl"
        value={values.bannerUrl}
        onChange={(value) => update("bannerUrl", value)}
        error={errors.bannerUrl}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ContestField id="format" label="Format" error={errors.format}>
          <SearchableSelect
            id="format"
            value={values.format}
            onValueChange={(next) => update("format", next as ContestFormat)}
            options={FORMAT_OPTIONS}
            className="h-11"
            aria-describedby={contestFieldDescribedBy("format", errors.format)}
          />
        </ContestField>
        <ContestField id="division" label="Division" error={errors.division}>
          <SearchableSelect
            id="division"
            value={values.division}
            onValueChange={(next) => update("division", next as ContestDivision)}
            options={DIVISION_OPTIONS}
            className="h-11"
            aria-describedby={contestFieldDescribedBy(
              "division",
              errors.division,
            )}
          />
        </ContestField>
        {isGroup ? (
          <ContestField
            id="teamSize"
            label="Team size"
            hint={`${CONTEST_TEAM_MIN_SIZE}–${CONTEST_TEAM_MAX_SIZE} coders per team.`}
            error={errors.teamSize}
          >
            <SearchableSelect
              id="teamSize"
              value={values.teamSize}
              onValueChange={(next) => update("teamSize", next)}
              options={TEAM_SIZE_OPTIONS}
              className="h-11"
              aria-describedby={contestFieldDescribedBy(
                "teamSize",
                errors.teamSize,
              )}
            />
          </ContestField>
        ) : null}
        <ContestField
          id="expectedParticipants"
          label="Expected participants"
          hint={isGroup ? "Teams, not individual coders." : undefined}
          error={errors.expectedParticipants}
        >
          <Input
            id="expectedParticipants"
            type="number"
            inputMode="numeric"
            min={10}
            max={10_000}
            value={values.expectedParticipants}
            onChange={(event) =>
              update("expectedParticipants", event.target.value)
            }
            className="h-11"
            aria-invalid={errors.expectedParticipants ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "expectedParticipants",
              errors.expectedParticipants,
              isGroup ? "Teams, not individual coders." : undefined,
            )}
          />
        </ContestField>
      </div>
      <div className="space-y-1.5">
        <MarkdownField
          id="description"
          label="Description"
          value={values.description}
          onChange={(value) => update("description", value)}
          rows={8}
          placeholder="What the round is about, who should join, and what makes it special."
        />
        {errors.description ? (
          <p
            role="alert"
            className="text-[11px] font-medium text-rose-600 dark:text-rose-400"
          >
            {errors.description}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            At least 40 characters. GitHub-flavoured Markdown.
          </p>
        )}
      </div>
    </Card>
  );
}

export function HostScheduleSection({ values, errors, update }: SectionProps) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold">Schedule</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ContestField id="startAt" label="Starts" error={errors.startAt}>
          <Input
            id="startAt"
            type="datetime-local"
            value={values.startAt}
            onChange={(event) => update("startAt", event.target.value)}
            className="h-11"
            aria-invalid={errors.startAt ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "startAt",
              errors.startAt,
            )}
          />
        </ContestField>
        <ContestField
          id="endAt"
          label="Ends"
          hint="Between 15 minutes and 24 hours."
          error={errors.endAt}
        >
          <Input
            id="endAt"
            type="datetime-local"
            value={values.endAt}
            onChange={(event) => update("endAt", event.target.value)}
            className="h-11"
            aria-invalid={errors.endAt ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "endAt",
              errors.endAt,
              "Between 15 minutes and 24 hours.",
            )}
          />
        </ContestField>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Times use your device timezone and are shown in UTC on the contest page.
      </p>
    </Card>
  );
}

export function HostContactSection({ values, errors, update }: SectionProps) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold">Sponsors and contact</h2>
      <ContestField
        id="sponsorNote"
        label="Sponsor or prize note (optional)"
        hint="Prize pool, sponsor name or goodies. Approved sponsors get a highlight on the contest page."
        error={errors.sponsorNote}
      >
        <Textarea
          id="sponsorNote"
          value={values.sponsorNote}
          onChange={(event) => update("sponsorNote", event.target.value)}
          maxLength={1_000}
          rows={3}
          aria-invalid={errors.sponsorNote ? true : undefined}
          aria-describedby={contestFieldDescribedBy(
            "sponsorNote",
            errors.sponsorNote,
            "Prize pool, sponsor name or goodies. Approved sponsors get a highlight on the contest page.",
          )}
        />
      </ContestField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ContestField
          id="contactEmail"
          label="Contact email"
          error={errors.contactEmail}
        >
          <Input
            id="contactEmail"
            type="email"
            value={values.contactEmail}
            onChange={(event) => update("contactEmail", event.target.value)}
            autoComplete="email"
            className="h-11"
            aria-invalid={errors.contactEmail ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "contactEmail",
              errors.contactEmail,
            )}
          />
        </ContestField>
        <ContestField
          id="contactPhone"
          label="Contact phone (optional)"
          error={errors.contactPhone}
        >
          <Input
            id="contactPhone"
            type="tel"
            value={values.contactPhone}
            onChange={(event) => update("contactPhone", event.target.value)}
            autoComplete="tel"
            placeholder="+8801…"
            className="h-11"
            aria-invalid={errors.contactPhone ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "contactPhone",
              errors.contactPhone,
            )}
          />
        </ContestField>
      </div>
    </Card>
  );
}

export function HostFeeSection({
  values,
  errors,
  update,
  paymentMethods,
}: SectionProps & { paymentMethods: PaymentMethodView[] }) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Wallet className="size-4 text-primary" aria-hidden="true" />
        Arrangement fee
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ContestField
          id="feeBdt"
          label="Fee"
          hint="Fixed community hosting fee."
          error={errors.feeBdt}
        >
          <SearchableSelect
            id="feeBdt"
            value={values.feeBdt}
            onValueChange={(next) => update("feeBdt", next)}
            options={FEE_OPTIONS}
            className="h-11"
            aria-describedby={contestFieldDescribedBy("feeBdt", errors.feeBdt)}
          />
        </ContestField>
        <ContestField
          id="paymentReference"
          label="Payment TrxID"
          error={errors.paymentReference}
        >
          <Input
            id="paymentReference"
            value={values.paymentReference}
            onChange={(event) =>
              update("paymentReference", event.target.value)
            }
            maxLength={80}
            autoComplete="off"
            placeholder="e.g. 9F7A2K1LMN"
            className="h-11 font-mono"
            aria-invalid={errors.paymentReference ? true : undefined}
            aria-describedby={contestFieldDescribedBy(
              "paymentReference",
              errors.paymentReference,
            )}
          />
        </ContestField>
      </div>
      <div className="space-y-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Send the exact fee with Send Money, then paste the TrxID. The admin
            team verifies every reference before scheduling your round.
          </span>
        </p>
        {paymentMethods.length > 0 ? (
          <ul className="space-y-1 border-t border-border/70 pt-2">
            {paymentMethods.map((method) => (
              <li key={method.id} className="flex flex-wrap gap-x-1.5">
                <span className="font-medium text-foreground">
                  {method.label}
                </span>
                <span className="font-mono">
                  {method.accountNumber ?? "QR"}
                </span>
                {method.accountName ? (
                  <span>· {method.accountName}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-border/70 pt-2">
            No payment account is configured on this deployment yet. Contact the
            contest team for the number before submitting a TrxID.
          </p>
        )}
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md border border-border p-3">
        <input
          id="agreement"
          type="checkbox"
          checked={values.agreement}
          onChange={(event) => update("agreement", event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
          aria-invalid={errors.agreement ? true : undefined}
          aria-describedby={errors.agreement ? "agreement-error" : undefined}
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          I confirm the details above, the organiser rules, and that the fee is
          paid and non-transferable to another date without approval.
        </span>
      </label>
      {errors.agreement ? (
        <p
          id="agreement-error"
          role="alert"
          className="-mt-2 text-[11px] font-medium text-rose-600 dark:text-rose-400"
        >
          {errors.agreement}
        </p>
      ) : null}
    </Card>
  );
}

export { HostChecklistAside } from "./host-checklist-aside";
