"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { ProblemPicker } from "@/components/admin/problem-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost, apiPut } from "@/lib/api-client";
import { studyListInputSchema } from "@/lib/schemas/study-list";
import type { AdminStudyListDetail, ProblemOption } from "@/lib/types";

export function StudyListForm({
  initial,
  options,
}: {
  initial: AdminStudyListDetail | null;
  options: ProblemOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [problemIds, setProblemIds] = useState<string[]>(
    initial?.problemIds ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = studyListInputSchema.safeParse({
      title,
      slug: slug || undefined,
      description,
      isPublic,
      problemIds,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      if (initial) {
        await apiPut(`/api/v1/admin/lists/${initial.id}`, parsed.data);
      } else {
        await apiPost("/api/v1/admin/lists", parsed.data);
      }
      toast({ title: "Study list saved", variant: "success" });
      router.push("/admin/lists");
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not save the study list.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="list-title">Title</Label>
            <Input
              id="list-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="list-slug">Slug (optional)</Label>
            <Input
              id="list-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="array-foundations"
              maxLength={80}
            />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="list-description">Description</Label>
          <Textarea
            id="list-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            className="min-h-24"
            required
          />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Public list
        </label>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Problems</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The order is the study order. Add up to 50 problems.
        </p>
        <div className="mt-4">
          <ProblemPicker
            options={options}
            selected={problemIds}
            onChange={setProblemIds}
            selectedLabel="List problems"
          />
        </div>
      </Card>

      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/95 p-3">
        <p className="text-xs text-muted-foreground">
          {problemIds.length} problems selected
        </p>
        <div className="flex gap-2">
          <Link
            href="/admin/lists"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {loading ? "Saving…" : "Save list"}
          </Button>
        </div>
      </div>
    </form>
  );
}
