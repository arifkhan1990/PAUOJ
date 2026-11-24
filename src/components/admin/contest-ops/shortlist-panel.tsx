"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError } from "@/lib/api-client";
import type {
  ContestCandidateStatus,
  ContestProblemCandidateView,
  ContestStaffNoteView,
} from "@/lib/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { formatRelative } from "@/lib/utils";
import { decideContestCandidate, proposeContestCandidate } from "./contest-ops-api";
import { NotesThread } from "./notes-thread";

function candidateVariant(
  status: ContestCandidateStatus,
): "warning" | "success" | "muted" {
  if (status === "SHORTLISTED") return "success";
  if (status === "REJECTED") return "muted";
  return "warning";
}

export function ShortlistPanel({
  contestId,
  initialCandidates,
  initialNotes,
  problemOptions,
  canPropose = true,
  canDecide = true,
}: {
  contestId: string;
  initialCandidates: ContestProblemCandidateView[];
  initialNotes: ContestStaffNoteView[];
  problemOptions: SelectOption[];
  canPropose?: boolean;
  canDecide?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [problemId, setProblemId] = useState(problemOptions[0]?.value ?? "");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const propose = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problemId) {
      setError("Choose a problem to propose.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const created = await proposeContestCandidate(contestId, {
        problemId,
        note: note.trim(),
      });
      setCandidates((current) => [created, ...current]);
      setNote("");
      toast({ title: "Candidate proposed", variant: "success" });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not propose this problem.";
      setError(message);
      toast({ title: "Proposal failed", description: message, variant: "error" });
    } finally {
      setAdding(false);
    }
  };

  const decide = async (
    candidate: ContestProblemCandidateView,
    status: "SHORTLISTED" | "REJECTED",
  ) => {
    setDecidingId(candidate.id);
    setError(null);
    try {
      await decideContestCandidate(contestId, candidate.id, status);
      setCandidates((current) =>
        current.map((item) =>
          item.id === candidate.id ? { ...item, status } : item,
        ),
      );
      toast({
        title: status === "SHORTLISTED" ? "Shortlisted" : "Candidate rejected",
        description: candidate.title,
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not update this candidate.";
      setError(message);
      toast({ title: "Action failed", description: message, variant: "error" });
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canPropose ? (
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Propose a fresh problem</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Candidates are internal until the director shortlists them. A fresh
          problem must be an unpublished draft that has never appeared in
          another contest.
        </p>
        <form onSubmit={(event) => void propose(event)} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="candidate-problem">Problem</Label>
              <SearchableSelect
                id="candidate-problem"
                value={problemId}
                onValueChange={setProblemId}
                options={problemOptions}
                placeholder="Search problems…"
                emptyMessage="No problems match"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="candidate-note">Note (optional)</Label>
              <Input
                id="candidate-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                placeholder="Why this problem fits the set"
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={adding}>
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Propose candidate
          </Button>
        </form>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Candidate shortlist</h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {candidates.length}{" "}
            {candidates.length === 1 ? "candidate" : "candidates"}
          </span>
        </div>

        {candidates.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
            No candidates yet. Setters can propose problems above.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {candidate.title}
                    </p>
                    <p className="break-all font-mono text-[11px] text-muted-foreground">
                      {candidate.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{candidate.difficulty}</Badge>
                    <Badge variant={candidateVariant(candidate.status)}>
                      {candidate.status.charAt(0) +
                        candidate.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>

                {candidate.note ? (
                  <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground">
                    {candidate.note}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {candidate.proposedBy
                      ? `Proposed by @${candidate.proposedBy.username} · `
                      : ""}
                    {formatRelative(candidate.createdAt)}
                  </p>
                  {canDecide ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="success"
                        className="min-h-11 sm:min-h-0"
                        onClick={() => void decide(candidate, "SHORTLISTED")}
                        disabled={
                          decidingId === candidate.id ||
                          candidate.status === "SHORTLISTED"
                        }
                      >
                        {decidingId === candidate.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        Shortlist
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11 text-destructive sm:min-h-0"
                        onClick={() => void decide(candidate, "REJECTED")}
                        disabled={
                          decidingId === candidate.id ||
                          candidate.status === "REJECTED"
                        }
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <NotesThread
          contestId={contestId}
          initialNotes={initialNotes}
          problemOptions={problemOptions}
        />
      </Card>
    </div>
  );
}
