import type { JudgeLanguage } from "@/server/judge/types";
import { normalizeReferenceLanguage } from "./problem-reference-language";

export type ApprovalReference = {
  language: JudgeLanguage;
  source: string;
};

/**
 * Review approvals carry the reviewer's own solution. It becomes the problem's
 * reference solution only when the language is judge-supported and the source
 * is non-empty; anything else is ignored so a bad approval cannot overwrite an
 * existing usable reference.
 */
export function referenceFromApproval(input: {
  solutionLanguage: string;
  solutionSource: string;
}): ApprovalReference | null {
  const source = input.solutionSource.trim();
  if (source.length === 0) return null;
  const language = normalizeReferenceLanguage(input.solutionLanguage);
  if (!language) return null;
  return { language, source };
}
