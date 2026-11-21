import type { TestForm } from "@/components/admin/test-case-editor";
import type {
  AdminProblemDetail,
  Difficulty,
  ProblemCheckerType,
} from "@/lib/types";

export type ProblemFormValues = {
  title: string;
  slug: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  editorial: string;
  difficulty: Difficulty;
  points: string;
  timeLimitMs: string;
  memoryLimitMb: string;
  tags: string;
  category: string;
  subcategory: string;
  companies: string;
  checkerType: ProblemCheckerType;
  checkerSource: string;
  floatTolerance: string;
  tests: TestForm[];
};

export function initialProblemFormValues(
  initial: AdminProblemDetail | null,
): ProblemFormValues {
  if (!initial) {
    return {
      title: "",
      slug: "",
      statement: "",
      inputFormat: "",
      outputFormat: "",
      constraints: "",
      editorial: "",
      difficulty: "EASY",
      points: "100",
      timeLimitMs: "1000",
      memoryLimitMb: "256",
      tags: "",
      category: "",
      subcategory: "",
      companies: "",
      checkerType: "EXACT",
      checkerSource: "",
      floatTolerance: "0.000001",
      tests: [
        { input: "", expectedOutput: "", isSample: true },
        { input: "", expectedOutput: "", isSample: false },
      ],
    };
  }

  return {
    title: initial.title,
    slug: initial.slug,
    statement: initial.statement,
    inputFormat: initial.inputFormat ?? "",
    outputFormat: initial.outputFormat ?? "",
    constraints: initial.constraints ?? "",
    editorial: initial.editorial ?? "",
    difficulty: initial.difficulty,
    points: String(initial.points),
    timeLimitMs: String(initial.timeLimitMs),
    memoryLimitMb: String(initial.memoryLimitMb),
    tags: initial.tags.join(", "),
    category: initial.category ?? "",
    subcategory: initial.subcategory ?? "",
    companies: initial.companies.join(", "),
    checkerType: initial.checkerType,
    checkerSource: initial.checkerSource ?? "",
    floatTolerance: String(initial.floatTolerance),
    tests: initial.tests,
  };
}
