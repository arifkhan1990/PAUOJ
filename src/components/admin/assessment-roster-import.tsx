"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type {
  RosterField,
  RosterImportCounts,
  RosterImportStatus,
  RosterMapping,
  RosterRowReport,
} from "@/lib/assessment-roster";
import { cn } from "@/lib/utils";

type ImportResponse = {
  rows: RosterRowReport[];
  counts: RosterImportCounts;
  mapping: RosterMapping;
  header: string[] | null;
};

type MappingState = Record<RosterField, string>;

const MAPPING_INPUTS: { field: RosterField; label: string; hint: string }[] = [
  {
    field: "candidate_ref",
    label: "Candidate ref",
    hint: "Required column — student / applicant ID",
  },
  { field: "email", label: "Email", hint: "Optional" },
  { field: "candidate_name", label: "Name", hint: "Optional" },
  { field: "group_label", label: "Group", hint: "Optional" },
];

const EMPTY_MAPPING: MappingState = {
  candidate_ref: "",
  email: "",
  candidate_name: "",
  group_label: "",
};

const COUNT_TILES: { key: keyof RosterImportCounts; label: string }[] = [
  { key: "created", label: "Created" },
  { key: "updated", label: "Updated" },
  { key: "unchanged", label: "Unchanged" },
  { key: "duplicate", label: "Duplicate" },
  { key: "invalid", label: "Invalid" },
];

const REPORT_BADGES: Record<
  RosterImportStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  created: { label: "Created", variant: "success" },
  updated: { label: "Updated", variant: "accent" },
  unchanged: { label: "Unchanged", variant: "muted" },
  duplicate: { label: "Duplicate", variant: "warning" },
  invalid: { label: "Invalid", variant: "destructive" },
};

const CSV_PLACEHOLDER = `candidate_ref,email,candidate_name,group_label
2210145,rakib@example.edu,Md. Rakib Hasan,CSE-3B
2210146,,Nusrat Jahan,CSE-3B`;

function buildMapping(state: MappingState): {
  mapping?: RosterMapping;
  error?: string;
} {
  const mapping: RosterMapping = {};
  for (const { field, label } of MAPPING_INPUTS) {
    const raw = state[field].trim();
    if (raw.length === 0) continue;
    const index = Number(raw);
    if (!Number.isInteger(index) || index < 0) {
      return {
        error: `${label} column must be a whole number of 0 or more (column A is 0).`,
      };
    }
    mapping[field] = index;
  }
  return Object.keys(mapping).length > 0 ? { mapping } : {};
}

function deliveryNote(row: RosterRowReport): string {
  if (row.status === "duplicate" || row.status === "invalid") return "";
  return row.delivery === "link"
    ? "No email — deliver this candidate by link."
    : "Email on file — ready to send.";
}

export function AssessmentRosterImport({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const [csv, setCsv] = useState("");
  const [groupLabel, setGroupLabel] = useState("");
  const [mapping, setMapping] = useState<MappingState>(EMPTY_MAPPING);
  const [showMapping, setShowMapping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportResponse | null>(null);
  const mappingId = useId();
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (importing || csv.trim().length === 0) return;
    setError(null);
    const { mapping: manualMapping, error: mappingError } =
      buildMapping(mapping);
    if (mappingError) {
      setError(mappingError);
      return;
    }

    setImporting(true);
    try {
      const data = await apiPost<ImportResponse>(
        `/api/v1/admin/assessments/${assessmentId}/invites`,
        {
          csv,
          ...(manualMapping ? { mapping: manualMapping } : {}),
          ...(groupLabel.trim() ? { groupLabel: groupLabel.trim() } : {}),
        },
      );
      setReport(data);
      const needsAttention = data.counts.duplicate + data.counts.invalid;
      toast({
        title: "Roster imported",
        description: `${data.counts.created} created, ${data.counts.updated} updated${
          needsAttention > 0 ? `, ${needsAttention} need attention` : ""
        }.`,
        variant: needsAttention > 0 ? "warning" : "success",
      });
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not import the roster. Try again.";
      setError(message);
      toast({ title: "Import failed", description: message, variant: "error" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">Candidates</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Paste a roster CSV with a header row. Email is optional: a row without
          an email still imports, and you deliver it with Copy link.
        </p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="roster-csv">Roster CSV</Label>
          <Textarea
            id="roster-csv"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={CSV_PLACEHOLDER}
            rows={8}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-describedby="roster-csv-help"
            className="min-h-40 font-mono text-xs"
          />
          <p
            id="roster-csv-help"
            className="text-[11px] leading-relaxed text-muted-foreground"
          >
            64 KB and 500 rows maximum. UTF-8, comma-separated; quoted values are
            supported. Duplicate refs or emails are reported per row.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="roster-group-label">Group label (optional)</Label>
            <Input
              id="roster-group-label"
              value={groupLabel}
              onChange={(event) => setGroupLabel(event.target.value)}
              placeholder="CSE-3B or Beximco Nov-2026"
            />
            <p className="text-[11px] text-muted-foreground">
              Applied to rows without their own group label.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end">
            <Button
              type="button"
              variant="outline"
              aria-expanded={showMapping}
              aria-controls={mappingId}
              onClick={() => setShowMapping((current) => !current)}
            >
              Column mapping
            </Button>
            <Button
              type="submit"
              disabled={importing || csv.trim().length === 0}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {importing ? "Importing…" : "Import roster"}
            </Button>
          </div>
        </div>

        <div
          id={mappingId}
          hidden={!showMapping}
          className="rounded-md border border-border bg-muted/30 p-3"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            Headers are detected automatically. Set a column only when a header
            is missing or renamed. Positions are 0-based (column A is 0) and
            override detection. candidate_ref is the student, applicant or
            employee ID.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MAPPING_INPUTS.map(({ field, label, hint }) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={`mapping-${field}`} className="text-xs">
                  {label}
                </Label>
                <Input
                  id={`mapping-${field}`}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={mapping[field]}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  placeholder="Auto"
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
          >
            {error}
          </div>
        ) : null}
      </form>

      {report ? <ImportReport report={report} /> : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        A row without an email is valid and link-only. Copy its link from the
        Invites table and send it to the candidate yourself.
      </p>
    </Card>
  );
}

function ImportReport({ report }: { report: ImportResponse }) {
  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        aria-live="polite"
      >
        {COUNT_TILES.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-md border border-border bg-muted/30 px-3 py-2"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-lg font-semibold tabular-nums",
                key === "duplicate" &&
                  report.counts[key] > 0 &&
                  "text-amber-700 dark:text-amber-300",
                key === "invalid" &&
                  report.counts[key] > 0 &&
                  "text-rose-700 dark:text-rose-300",
              )}
            >
              {report.counts[key]}
            </p>
          </div>
        ))}
      </div>

      <div className="max-h-80 overflow-auto rounded-md border border-border">
        <table className="w-full caption-bottom text-sm">
          <caption className="sr-only">Per-row roster import report</caption>
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              <th scope="col" className="h-9 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Row
              </th>
              <th scope="col" className="h-9 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reference
              </th>
              <th scope="col" className="h-9 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Candidate
              </th>
              <th scope="col" className="h-9 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th scope="col" className="h-9 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => {
              const badge = REPORT_BADGES[row.status];
              return (
                <tr
                  key={`${row.rowNumber}-${row.candidateRef}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                    {row.rowNumber}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.candidateRef || "—"}
                  </td>
                  <td className="max-w-[200px] break-words px-3 py-2 text-xs">
                    <p>{row.candidateName ?? "—"}</p>
                    {row.groupLabel ? (
                      <p className="text-muted-foreground">{row.groupLabel}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="max-w-[260px] break-words px-3 py-2 text-xs">
                    {row.reason ? (
                      <>
                        <p>{row.reason}</p>
                        {row.fix ? (
                          <p className="mt-0.5 text-muted-foreground">
                            {row.fix}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        {deliveryNote(row)}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
