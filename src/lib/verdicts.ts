export type Verdict =
  | "QUEUED"
  | "JUDGING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "SYSTEM_ERROR";

export const TERMINAL_VERDICTS: Verdict[] = [
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "OUTPUT_LIMIT_EXCEEDED",
  "SYSTEM_ERROR",
];

type VerdictMeta = {
  label: string;
  short: string;
  className: string;
  dotClassName: string;
  chartColor: string;
  description: string;
};

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  QUEUED: {
    label: "In queue",
    short: "Queued",
    className: "border-border bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
    chartColor: "#94a3b8",
    description: "Your submission is waiting for a free judge.",
  },
  JUDGING: {
    label: "Judging",
    short: "Judging",
    className: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    dotClassName: "bg-sky-500",
    chartColor: "#0ea5e9",
    description: "Your code is being compiled and tested.",
  },
  ACCEPTED: {
    label: "Accepted",
    short: "AC",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    dotClassName: "bg-emerald-500",
    chartColor: "#10b981",
    description: "All tests passed. Nice work!",
  },
  WRONG_ANSWER: {
    label: "Wrong answer",
    short: "WA",
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    dotClassName: "bg-rose-500",
    chartColor: "#f43f5e",
    description: "Your output did not match the expected answer.",
  },
  TIME_LIMIT_EXCEEDED: {
    label: "Time limit exceeded",
    short: "TLE",
    className: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    dotClassName: "bg-amber-500",
    chartColor: "#f59e0b",
    description: "Your program ran longer than the time limit.",
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: "Memory limit exceeded",
    short: "MLE",
    className: "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
    dotClassName: "bg-orange-500",
    chartColor: "#f97316",
    description: "Your program used more memory than allowed.",
  },
  RUNTIME_ERROR: {
    label: "Runtime error",
    short: "RE",
    className: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    dotClassName: "bg-red-500",
    chartColor: "#ef4444",
    description: "Your program crashed while running a test.",
  },
  COMPILATION_ERROR: {
    label: "Compilation error",
    short: "CE",
    className: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    dotClassName: "bg-slate-500",
    chartColor: "#64748b",
    description: "The compiler could not build your submission.",
  },
  OUTPUT_LIMIT_EXCEEDED: {
    label: "Output limit exceeded",
    short: "OLE",
    className: "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
    dotClassName: "bg-yellow-500",
    chartColor: "#eab308",
    description: "Your program produced too much output.",
  },
  SYSTEM_ERROR: {
    label: "Judge error",
    short: "IE",
    className: "border-red-400 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
    dotClassName: "bg-red-600",
    chartColor: "#dc2626",
    description: "The judge could not complete this run. Try rejudging.",
  },
};

export function verdictMeta(status: string): VerdictMeta {
  return VERDICT_META[status as Verdict] ?? VERDICT_META.SYSTEM_ERROR;
}

export function isPendingVerdict(status: string): boolean {
  return status === "QUEUED" || status === "JUDGING";
}

export function isAccepted(status: string): boolean {
  return status === "ACCEPTED";
}
