"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HostBasicsSection,
  HostChecklistAside,
  HostContactSection,
  HostFeeSection,
  HostScheduleSection,
} from "@/features/contests/host-contest-sections";
import {
  HOST_FIELD_IDS,
  defaultHostValues,
  type HostFormErrors,
  type HostFormValues,
} from "@/features/contests/host-contest-values";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  CONTEST_HOST_REQUEST_STATUS_LABEL,
  type ContestHostRequestView,
} from "@/lib/contest-ops";
import { contestHostRequestSchema } from "@/lib/schemas/contest-ops";
import type { PaymentMethodView } from "@/lib/learning/payment-types";
import { cn } from "@/lib/utils";

export function HostContestForm({
  defaultContactEmail = "",
  paymentMethods,
}: {
  defaultContactEmail?: string;
  paymentMethods: PaymentMethodView[];
}) {
  const { toast } = useToast();
  const [values, setValues] = useState<HostFormValues>(() =>
    defaultHostValues(defaultContactEmail),
  );
  const [errors, setErrors] = useState<HostFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ContestHostRequestView | null>(null);

  useEffect(() => {
    if (!dirty || result) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, result]);

  const update = <K extends keyof HostFormValues>(
    key: K,
    value: HostFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
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
    const nextErrors: HostFormErrors = {};
    const start = new Date(values.startAt);
    const end = new Date(values.endAt);
    const expected = Number(values.expectedParticipants);
    if (Number.isNaN(start.getTime())) {
      nextErrors.startAt = "Choose a valid start date and time.";
    }
    if (Number.isNaN(end.getTime())) {
      nextErrors.endAt = "Choose a valid end date and time.";
    }
    if (!Number.isInteger(expected)) {
      nextErrors.expectedParticipants = "Enter the expected number of coders.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document.getElementById(Object.keys(nextErrors)[0] ?? "")?.focus();
      return;
    }

    const parsed = contestHostRequestSchema.safeParse({
      title: values.title,
      description: values.description,
      bannerUrl: values.bannerUrl.trim() || undefined,
      format: values.format,
      division: values.division,
      teamSize: Number(values.teamSize),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      expectedParticipants: expected,
      sponsorNote: values.sponsorNote,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      feeBdt: Number(values.feeBdt),
      paymentReference: values.paymentReference,
      agreement: values.agreement,
    });

    if (!parsed.success) {
      const fieldErrors: HostFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstId = HOST_FIELD_IDS.find((id) => fieldErrors[id]);
      if (firstId) document.getElementById(firstId)?.focus();
      toast({
        title: "Check the request",
        description: "Some fields need attention before you can submit.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const created = await apiPost<ContestHostRequestView>(
        "/api/v1/contests/host-requests",
        parsed.data,
      );
      setResult(created);
      setDirty(false);
      toast({
        title: "Hosting request submitted",
        description: "The contest team will review it and reply by email.",
        variant: "success",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not submit the hosting request.";
      setFormError(message);
      toast({ title: "Submission failed", description: message, variant: "error" });
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
        <h2 className="mt-4 text-lg font-semibold">Hosting request submitted</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status:{" "}
          <span className="font-medium text-foreground">
            {CONTEST_HOST_REQUEST_STATUS_LABEL[result.status]}
          </span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Request reference</p>
        <code className="mt-1 block break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
          {result.id}
        </code>
        <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
          <li>1. The contest team reviews your data and payment reference.</li>
          <li>
            2. Approved requests become a private draft contest, and you are
            added as the contest director.
          </li>
          <li>
            3. The contest team attaches the fresh problem set and publishes the
            draft; you stay credited as director and cannot compete.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/contests" className={cn(buttonVariants(), "h-11")}>
            Back to contests
          </Link>
          <Link
            href="/contests/host"
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            Submit another request
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={(event) => void submit(event)} className="min-w-0 space-y-5">
        {formError ? (
          <div
            role="alert"
            className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
          >
            {formError}
          </div>
        ) : null}

        <HostBasicsSection values={values} errors={errors} update={update} />
        <HostScheduleSection values={values} errors={errors} update={update} />
        <HostContactSection values={values} errors={errors} update={update} />
        <HostFeeSection
          values={values}
          errors={errors}
          update={update}
          paymentMethods={paymentMethods}
        />

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "No unsaved changes"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/contests"
              className={cn(buttonVariants({ variant: "ghost" }), "h-11")}
            >
              Cancel
            </Link>
            <Button type="submit" className="h-11" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              {loading ? "Submitting…" : "Submit hosting request"}
            </Button>
          </div>
        </div>
      </form>

      <HostChecklistAside />
    </div>
  );
}
