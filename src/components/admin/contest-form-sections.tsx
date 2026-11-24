"use client";

import Link from "next/link";
import { Info, ShieldAlert, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MarkdownField } from "@/components/admin/markdown-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card } from "@/components/ui/card";
import {
  CONTEST_TEAM_MAX_SIZE,
  CONTEST_TEAM_MIN_SIZE,
} from "@/lib/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { cn } from "@/lib/utils";
import type { ContestFormUpdate, ContestFormValues } from "./contest-form-values";

const DIVISION_OPTIONS: SelectOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "DIV1", label: "Div. 1" },
  { value: "DIV2", label: "Div. 2" },
  { value: "DIV3", label: "Div. 3" },
  { value: "DIV4", label: "Div. 4" },
];

const FORMAT_OPTIONS: SelectOption[] = [
  {
    value: "SINGLE",
    label: "Solo",
    description: "One coder per entry, individual ranking.",
  },
  {
    value: "GROUP",
    label: "Team",
    description: "Teams of 2–6 coders share one ranking. Unrated.",
  },
];

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-4 p-5", className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

function ToggleRow({
  id,
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

export function ContestBasicsSection({
  values,
  update,
}: {
  values: ContestFormValues;
  update: ContestFormUpdate;
}) {
  return (
    <SectionCard
      title="Basics"
      description="The public title, route, division and the window coders can compete in."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(event) => update("title", event.target.value)}
            required
            maxLength={120}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(event) => update("slug", event.target.value)}
            placeholder="generated-from-title"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="division">Division</Label>
          <SearchableSelect
            id="division"
            value={values.division}
            onValueChange={(next) =>
              update("division", next as ContestFormValues["division"])
            }
            options={DIVISION_OPTIONS}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startAt">Starts</Label>
          <Input
            id="startAt"
            type="datetime-local"
            value={values.startAt}
            onChange={(event) => update("startAt", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endAt">Ends</Label>
          <Input
            id="endAt"
            type="datetime-local"
            value={values.endAt}
            onChange={(event) => update("endAt", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="freezeMinutes">Freeze (minutes)</Label>
          <Input
            id="freezeMinutes"
            type="number"
            min="0"
            max="720"
            value={values.freezeMinutes}
            onChange={(event) => update("freezeMinutes", event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            0 disables the scoreboard freeze.
          </p>
        </div>
        <label
          htmlFor="isPublic"
          className="flex min-h-11 cursor-pointer items-center gap-2 self-end rounded-md pb-1 text-sm"
        >
          <input
            id="isPublic"
            type="checkbox"
            checked={values.isPublic}
            onChange={(event) => update("isPublic", event.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Public contest
        </label>
      </div>
      <MarkdownField
        id="description"
        label="Description"
        value={values.description}
        onChange={(value) => update("description", value)}
        rows={5}
        placeholder="What the round is about, who it is for and what to bring."
      />
    </SectionCard>
  );
}

export function ContestFormatSection({
  values,
  update,
  operationsHref,
  showOfficial = true,
}: {
  values: ContestFormValues;
  update: ContestFormUpdate;
  operationsHref?: string;
  showOfficial?: boolean;
}) {
  return (
    <SectionCard
      title="Format & policy"
      description="Solo or team play, official status and the fresh-problem rule."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="format">Format</Label>
          <SearchableSelect
            id="format"
            value={values.format}
            onValueChange={(next) =>
              update("format", next as ContestFormValues["format"])
            }
            options={FORMAT_OPTIONS}
            searchable={false}
          />
          <p className="text-[11px] text-muted-foreground">
            {values.format === "GROUP"
              ? "Teams share one scoreboard; team rounds are unrated."
              : "Individual ICPC ranking; solo coders can earn rating."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teamSize">Team size</Label>
          <Input
            id="teamSize"
            type="number"
            min={CONTEST_TEAM_MIN_SIZE}
            max={CONTEST_TEAM_MAX_SIZE}
            value={values.teamSize}
            onChange={(event) => update("teamSize", event.target.value)}
            disabled={values.format !== "GROUP"}
          />
          <p className="text-[11px] text-muted-foreground">
            {values.format === "GROUP"
              ? `${CONTEST_TEAM_MIN_SIZE}–${CONTEST_TEAM_MAX_SIZE} coders per team. Captains create a team and share the invite code.`
              : "Solo contests ignore this value and always run one coder per entry."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {showOfficial ? (
          <ToggleRow
            id="isOfficial"
            checked={values.isOfficial}
            onChange={(checked) => update("isOfficial", checked)}
            label="Official round"
            description="Official rounds are badged on the public contest list and included in the monthly series."
            icon={ShieldCheck}
          />
        ) : (
          <p className="flex min-h-11 items-start gap-2 rounded-lg border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            Official status is set by an admin. Teacher contests stay community
            rounds.
          </p>
        )}
        <ToggleRow
          id="requiresFreshProblems"
          checked={values.requiresFreshProblems}
          onChange={(checked) => update("requiresFreshProblems", checked)}
          label="Fresh problems only"
          description="Every problem must be an unpublished draft that never appeared in another contest."
          icon={ShieldAlert}
        />
      </div>

      {values.requiresFreshProblems ? (
        <div className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
          <p className="font-semibold">Fresh-problem policy</p>
          <p className="mt-1">
            Saving reserves this contest as the problem&apos;s first use. Each
            selected problem must stay a draft (unpublished) and cannot be
            linked to any other contest. Reusing a problem breaks the policy and
            is rejected on save.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">Fresh policy is off</p>
          <p className="mt-1">
            You can now link a problem that is already public or was used in
            another contest. Only do this for practice or archive rounds —
            reusing a problem in a rated round is unfair to participants.
          </p>
        </div>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Sponsor packages are managed separately from the contest operations
          page after the contest exists.
          {operationsHref ? (
            <>
              {" "}
              <Link
                href={operationsHref}
                className="font-medium text-primary hover:underline"
              >
                Open operations
              </Link>
              .
            </>
          ) : null}
        </span>
      </p>
    </SectionCard>
  );
}
