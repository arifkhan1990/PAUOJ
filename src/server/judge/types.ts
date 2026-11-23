import type { Verdict } from "@/lib/verdicts";

export type JudgeLanguage =
  | "c"
  | "cpp"
  | "python"
  | "javascript"
  | "java"
  | "csharp"
  | "go"
  | "php"
  | "kotlin"
  | "swift"
  | "sql"
  | "mysql"
  | "postgresql";

export type JudgeTest = {
  id: string;
  position: number;
  input: string;
  expectedOutput: string | null;
  isSample: boolean;
};

export type JudgeChecker = {
  type: "EXACT" | "TOKEN" | "FLOAT" | "CUSTOM";
  source: string | null;
  floatTolerance: number;
};

export type JudgeRequest = {
  language: JudgeLanguage;
  source: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  tests: JudgeTest[];
  checker: JudgeChecker;
  mode: "submission" | "run";
};

export type JudgeTestOutcome = {
  position: number;
  status: Verdict;
  runtimeMs: number;
  memoryKb: number;
  message: string | null;
};

export type JudgeOutcome = {
  status: Verdict;
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  compileOutput: string | null;
  errorMessage: string | null;
  results: JudgeTestOutcome[];
  runStdout: string;
  runStderr: string;
};

export class JudgeInfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JudgeInfrastructureError";
  }
}
