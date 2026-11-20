"use client";

import { useEffect, useState } from "react";
import type { SubmissionDetail } from "@/lib/types";
import { isPendingVerdict } from "@/lib/verdicts";

export function useSubmissionStream(submissionId: string | null): {
  submission: SubmissionDetail | null;
  connecting: boolean;
} {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!submissionId) {
      setSubmission(null);
      setConnecting(false);
      return;
    }

    let closed = false;
    let source: EventSource | null = null;
    setConnecting(true);

    const connect = () => {
      source = new EventSource(`/api/v1/submissions/${submissionId}/events`);
      source.addEventListener("update", (event) => {
        if (closed) return;
        try {
          const payload = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as SubmissionDetail;
          setSubmission(payload);
          setConnecting(false);
          if (!isPendingVerdict(payload.status)) source?.close();
        } catch {
          setConnecting(false);
        }
      });
      source.addEventListener("done", () => {
        source?.close();
      });
      source.addEventListener("error", () => {
        setConnecting(false);
      });
    };

    connect();

    return () => {
      closed = true;
      source?.close();
    };
  }, [submissionId]);

  return { submission, connecting };
}
