"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api-client";
import {
  CONTEST_SPONSOR_TIER_CLASS,
  CONTEST_SPONSOR_TIER_LABEL,
  type ContestOperationsDetail,
  type ContestSponsorStatus,
} from "@/lib/contest-ops";
import { formatRelative } from "@/lib/utils";
import { reviewContestSponsorship } from "./contest-ops-api";

type SponsorRow = ContestOperationsDetail["sponsors"][number];

function statusVariant(
  status: ContestSponsorStatus,
): "warning" | "success" | "destructive" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  return "warning";
}

export function SponsorsPanel({
  contestId,
  initialSponsors,
  canReview = true,
}: {
  contestId: string;
  initialSponsors: SponsorRow[];
  canReview?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const review = async (
    sponsor: SponsorRow,
    decision: "APPROVED" | "REJECTED",
  ) => {
    const note = (notes[sponsor.id] ?? "").trim();
    if (decision === "REJECTED" && note.length === 0) {
      setErrors((current) => ({
        ...current,
        [sponsor.id]: "Explain why the sponsorship was rejected.",
      }));
      return;
    }
    setBusyId(sponsor.id);
    setErrors((current) => {
      const next = { ...current };
      delete next[sponsor.id];
      return next;
    });
    try {
      await reviewContestSponsorship(
        contestId,
        sponsor.id,
        decision,
        note,
      );
      setSponsors((current) =>
        current.map((item) =>
          item.id === sponsor.id
            ? { ...item, status: decision, reviewedAt: new Date().toISOString() }
            : item,
        ),
      );
      toast({
        title:
          decision === "APPROVED" ? "Sponsor approved" : "Sponsorship rejected",
        description: `${sponsor.name} · ${CONTEST_SPONSOR_TIER_LABEL[sponsor.tier]}`,
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not review this sponsorship.";
      setErrors((current) => ({ ...current, [sponsor.id]: message }));
      toast({ title: "Action failed", description: message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Sponsorships</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Only approved sponsors appear on the public contest page. Rejections
            need a note so the requester knows why.
          </p>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {sponsors.length} {sponsors.length === 1 ? "request" : "requests"}
        </span>
      </div>

      {sponsors.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          No sponsorship requests for this contest yet. Anyone can apply from
          the public contest page.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="break-words text-sm font-medium">
                      {sponsor.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={CONTEST_SPONSOR_TIER_CLASS[sponsor.tier]}
                    >
                      {CONTEST_SPONSOR_TIER_LABEL[sponsor.tier]}
                    </Badge>
                    <Badge variant={statusVariant(sponsor.status)}>
                      {sponsor.status.charAt(0) +
                        sponsor.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    {sponsor.amountBdt === null ? null : (
                      <span className="font-mono tabular-nums">
                        ৳{sponsor.amountBdt.toLocaleString("en-US")}
                      </span>
                    )}
                    {sponsor.websiteUrl ? (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        Website
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ) : null}
                    {sponsor.reviewedAt ? (
                      <span>Reviewed {formatRelative(sponsor.reviewedAt)}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {canReview && sponsor.status === "PENDING" ? (
                <div className="mt-3 space-y-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`sponsor-note-${sponsor.id}`}>
                      Review note{" "}
                      <span className="font-normal text-muted-foreground">
                        (required to reject)
                      </span>
                    </Label>
                    <Textarea
                      id={`sponsor-note-${sponsor.id}`}
                      value={notes[sponsor.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [sponsor.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      maxLength={500}
                      placeholder="What did you verify?"
                      disabled={busyId === sponsor.id}
                    />
                  </div>
                  {errors[sponsor.id] ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {errors[sponsor.id]}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="success"
                      className="min-h-11 sm:min-h-0"
                      onClick={() => void review(sponsor, "APPROVED")}
                      disabled={busyId === sponsor.id}
                    >
                      {busyId === sponsor.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 text-destructive sm:min-h-0"
                      onClick={() => void review(sponsor, "REJECTED")}
                      disabled={busyId === sponsor.id}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
