"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api-client";
import type { ContestStaffNoteView } from "@/lib/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { formatRelative } from "@/lib/utils";
import { addContestStaffNote } from "./contest-ops-api";

const NO_PROBLEM = "none";

export function NotesThread({
  contestId,
  initialNotes,
  problemOptions,
}: {
  contestId: string;
  initialNotes: ContestStaffNoteView[];
  problemOptions: SelectOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [problemId, setProblemId] = useState(NO_PROBLEM);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: SelectOption[] = [
    { value: NO_PROBLEM, label: "No specific problem" },
    ...problemOptions,
  ];

  const post = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Write a note before posting.");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const created = await addContestStaffNote(contestId, {
        body: trimmed,
        problemId: problemId === NO_PROBLEM ? "" : problemId,
      });
      setNotes((current) => [created, ...current]);
      setBody("");
      setProblemId(NO_PROBLEM);
      toast({ title: "Note posted", variant: "success" });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not post this note.";
      setError(message);
      toast({ title: "Post failed", description: message, variant: "error" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Crew notes</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Internal thread for the crew. Notes are never shown to participants.
        </p>
      </div>

      <form onSubmit={(event) => void post(event)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="crew-note">New note</Label>
          <Textarea
            id="crew-note"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Test coverage, editorial plan, difficulty concerns…"
            disabled={posting}
          />
        </div>
        <div className="space-y-1.5 sm:max-w-sm">
          <Label htmlFor="crew-note-problem">Problem (optional)</Label>
          <SearchableSelect
            id="crew-note-problem"
            value={problemId}
            onValueChange={setProblemId}
            options={options}
            searchPlaceholder="Search problems…"
          />
        </div>
        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={posting}>
          {posting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="size-4" />
          )}
          Post note
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          No notes yet. Use this thread to coordinate the set before the round.
        </p>
      ) : (
        <ol className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border bg-muted/10 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium">
                  {note.author.displayName}{" "}
                  <span className="font-mono text-[11px] font-normal text-muted-foreground">
                    @{note.author.username}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatRelative(note.createdAt)}
                </p>
              </div>
              {note.problemTitle ? (
                <Badge variant="outline" className="mt-1.5">
                  {note.problemTitle}
                </Badge>
              ) : null}
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
