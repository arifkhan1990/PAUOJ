import { promises as fs } from "node:fs";
import path from "node:path";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import type { Verdict } from "@/lib/verdicts";
import { runContainer } from "./docker";
import {
  COMPILE_COMMANDS,
  COMPILE_MEMORY_MB,
  COMPILE_OUTPUT_CAP,
  LANGUAGE_SOURCE,
  memoryWithOverhead,
  runtimeResourceOverrides,
  startupAllowanceMs,
} from "./language-config";
import {
  JudgeInfrastructureError,
  type JudgeLanguage,
  type JudgeOutcome,
  type JudgeRequest,
  type JudgeTestOutcome,
} from "./types";

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}\n…` : value;
}

type HarnessResult = {
  position: number;
  status: Verdict;
  runtimeMs: number;
  memoryKb: number;
  message: string | null;
  stdout?: string;
  stderr?: string;
};

type HarnessPayload = {
  mode: "submission" | "run";
  results: HarnessResult[];
  current: number | null;
  error?: string;
};

async function writeTextFile(
  filePath: string,
  contents: string,
  mode = 0o644,
): Promise<void> {
  await fs.writeFile(filePath, contents, "utf8");
  await fs.chmod(filePath, mode);
}

async function prepareWorkspace(
  request: JudgeRequest,
): Promise<{ workDir: string; resultsDir: string; testsDir: string }> {
  const sourceFile = LANGUAGE_SOURCE[request.language];
  if (!sourceFile) {
    throw new JudgeInfrastructureError(
      `Unsupported judge language: ${String(request.language)}`,
    );
  }
  const root = path.resolve(getEnv().JUDGE_WORK_DIR);
  await fs.mkdir(root, { recursive: true, mode: 0o755 });
  const workDir = await fs.mkdtemp(path.join(root, "submission-"));
  await fs.chmod(workDir, 0o777);

  const testsDir = path.join(workDir, "tests");
  const resultsDir = path.join(workDir, "results");
  const expectedDir = path.join(resultsDir, "expected");
  await fs.mkdir(testsDir, { recursive: true, mode: 0o700 });
  await fs.mkdir(resultsDir, { recursive: true, mode: 0o700 });
  await fs.chmod(resultsDir, 0o700);
  await fs.mkdir(expectedDir, { recursive: true, mode: 0o700 });
  await fs.chmod(expectedDir, 0o700);

  await writeTextFile(
    path.join(workDir, sourceFile),
    request.source,
  );
  if (
    request.mode === "submission" &&
    request.checker.type === "CUSTOM" &&
    request.checker.source
  ) {
    await writeTextFile(
      path.join(workDir, "checker.py"),
      request.checker.source,
      0o755,
    );
  }

  // Test inputs are read by the trusted harness and passed to the child on
  // stdin. Expected outputs stay in the root-only results directory so
  // submitted code cannot read the answers.
  for (const test of request.tests) {
    const position = test.position;
    await writeTextFile(path.join(testsDir, `input-${position}.txt`), test.input);
    if (test.expectedOutput !== null) {
      await writeTextFile(
        path.join(expectedDir, `expected-${position}.txt`),
        test.expectedOutput,
      );
    }
  }

  return { workDir, resultsDir, testsDir };
}

function imageForLanguage(language: JudgeLanguage): string {
  const env = getEnv();
  return language === "swift" ? env.JUDGE_SWIFT_IMAGE : env.JUDGE_IMAGE;
}

async function compile(
  request: JudgeRequest,
  workDir: string,
): Promise<{ ok: boolean; output: string }> {
  const env = getEnv();
  const compileTimeoutMs =
    request.language === "kotlin"
      ? Math.max(env.JUDGE_COMPILE_TIMEOUT_MS, 90_000)
      : request.language === "swift"
        ? Math.max(env.JUDGE_COMPILE_TIMEOUT_MS, 60_000)
        : env.JUDGE_COMPILE_TIMEOUT_MS;
  const result = await runContainer({
    image: imageForLanguage(request.language),
    workDir,
    workDirReadOnly: false,
    command: COMPILE_COMMANDS[request.language],
    memoryMb: COMPILE_MEMORY_MB,
    timeoutMs: compileTimeoutMs,
    user: "65534:65534",
    readOnlyRootfs: true,
    tmpfsSizeMb: 256,
    extraEnv: {
      PYTHONDONTWRITEBYTECODE: "1",
      ...(request.language === "go"
        ? { GOCACHE: "/tmp/go-cache", GOPATH: "/tmp/go" }
        : {}),
    },
  });

  const output = truncate(
    [result.stdout, result.stderr].filter(Boolean).join("\n").trim(),
    COMPILE_OUTPUT_CAP,
  );

  if (result.timedOut) {
    return {
      ok: false,
      output: `Compilation timed out after ${compileTimeoutMs / 1000}s.\n${output}`.trim(),
    };
  }
  if (result.oomKilled) {
    return {
      ok: false,
      output: `The compiler ran out of memory.\n${output}`.trim(),
    };
  }
  if (result.exitCode !== 0) {
    return {
      ok: false,
      output: output || "Compilation failed without an error message.",
    };
  }
  return { ok: true, output: "" };
}

async function readHarnessPayload(
  resultsFile: string,
): Promise<HarnessPayload | null> {
  try {
    const raw = await fs.readFile(resultsFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<HarnessPayload>;
    if (!Array.isArray(parsed.results)) return null;
    return {
      mode: parsed.mode === "run" ? "run" : "submission",
      results: parsed.results,
      current: typeof parsed.current === "number" ? parsed.current : null,
      error: typeof parsed.error === "string" ? parsed.error : undefined,
    };
  } catch {
    return null;
  }
}

function outcomeFromFailure(
  request: JudgeRequest,
  status: Verdict,
  message: string,
): JudgeOutcome {
  return {
    status,
    passedTests: 0,
    totalTests: request.tests.length,
    runtimeMs: null,
    memoryKb: null,
    compileOutput: null,
    errorMessage: message,
    results: [],
    runStdout: "",
    runStderr: "",
  };
}

async function readRunOutput(
  resultsDir: string,
): Promise<{ stdout: string; stderr: string }> {
  const read = async (name: string): Promise<string> => {
    try {
      const raw = await fs.readFile(path.join(resultsDir, name), "utf8");
      return truncate(raw, 65_536);
    } catch {
      return "";
    }
  };
  return { stdout: await read("stdout.txt"), stderr: await read("stderr.txt") };
}

export async function runJudge(request: JudgeRequest): Promise<JudgeOutcome> {
  const { workDir, resultsDir } = await prepareWorkspace(request);
  const resultsFile = path.join(resultsDir, "results.json");

  try {
    const compiled = await compile(request, workDir);
    if (!compiled.ok) {
      return {
        status: "COMPILATION_ERROR",
        passedTests: 0,
        totalTests: request.tests.length,
        runtimeMs: null,
        memoryKb: null,
        compileOutput: compiled.output,
        errorMessage: null,
        results: [],
        runStdout: "",
        runStderr: "",
      };
    }

    // Booting a real SQL server is part of each test's wall clock. Give those
    // engines a fixed startup allowance so a correct query is not reported as
    // a time-limit failure.
    const effectiveTimeLimitMs =
      request.timeLimitMs + startupAllowanceMs(request.language);

    // The harness classifies memory from the child's peak RSS, which includes
    // the database process baseline. Use the same budget the container gets so
    // a normal MariaDB/PostgreSQL boot is not reported as a memory-limit failure.
    const containerMemoryMb = memoryWithOverhead(
      request.language,
      request.memoryLimitMb,
    );
    const harnessMemoryLimitMb =
      request.language === "mysql" || request.language === "postgresql"
        ? containerMemoryMb
        : request.memoryLimitMb;
    const resources = runtimeResourceOverrides(request.language);

    const runTimeout = Math.min(
      180_000,
      request.tests.length * (effectiveTimeLimitMs + 800) + 8_000,
    );
    const result = await runContainer({
      image: imageForLanguage(request.language),
      workDir,
      workDirReadOnly: true,
      resultsDir,
      command: [
        "python3",
        "/harness.py",
        "--language",
        request.language,
        "--time-limit-ms",
        String(effectiveTimeLimitMs),
        "--memory-limit-mb",
        String(harnessMemoryLimitMb),
        "--tests",
        String(request.tests.length),
        "--mode",
        request.mode,
        "--checker",
        request.checker.type.toLowerCase(),
        "--float-tolerance",
        String(request.checker.floatTolerance),
        "--checker-script",
        request.mode === "submission" && request.checker.type === "CUSTOM"
          ? "/work/checker.py"
          : "",
        "--test-dir",
        "/work/tests",
        "--work-dir",
        "/work",
        "--results",
        "/results/results.json",
        "--expected-dir",
        "/results/expected",
        "--output-dir",
        "/results",
      ],
      memoryMb: containerMemoryMb,
      timeoutMs: runTimeout,
      readOnlyRootfs: true,
      // MariaDB needs a writable ~25 MB data directory plus InnoDB temp files.
      tmpfsSizeMb: resources.tmpfsSizeMb,
      noFileLimit: resources.noFileLimit,
      // The trusted harness runs as root and writes to a root-only results
      // directory. The untrusted child is dropped to nobody, so this single
      // capability cannot be used by submitted code.
      capAdd: ["DAC_OVERRIDE", "SETUID", "SETGID", "KILL"],
      extraEnv: {
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONUNBUFFERED: "1",
        ...(request.sqlScript ? { SQL_SCRIPT: "1" } : {}),
      },
    });

    const payload = await readHarnessPayload(resultsFile);
    const runOutput =
      request.mode === "run"
        ? await readRunOutput(resultsDir)
        : { stdout: "", stderr: "" };

    if (payload?.error) {
      logger.warn("Judge harness reported an error", { error: payload.error });
      return outcomeFromFailure(request, "SYSTEM_ERROR", payload.error);
    }

    if (!payload) {
      logger.warn("Judge produced no payload", {
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        oomKilled: result.oomKilled,
        stdout: result.stdout.slice(0, 500),
        stderr: result.stderr.slice(0, 1000),
      });
      if (result.oomKilled) {
        return outcomeFromFailure(
          request,
          "MEMORY_LIMIT_EXCEEDED",
          "The judge container exceeded its memory limit.",
        );
      }
      if (result.timedOut) {
        return outcomeFromFailure(
          request,
          "TIME_LIMIT_EXCEEDED",
          "The judge container exceeded the total time limit.",
        );
      }
      return outcomeFromFailure(
        request,
        "SYSTEM_ERROR",
        "The judge produced no test results.",
      );
    }

    const results = payload.results.filter(
      (item) =>
        typeof item.position === "number" &&
        typeof item.status === "string" &&
        typeof item.runtimeMs === "number",
    );

    if (payload.current !== null && (result.oomKilled || result.timedOut)) {
      results.push({
        position: payload.current,
        status: result.oomKilled
          ? "MEMORY_LIMIT_EXCEEDED"
          : "TIME_LIMIT_EXCEEDED",
        runtimeMs: 0,
        memoryKb: result.oomKilled ? request.memoryLimitMb * 1024 : 0,
        message: result.oomKilled
          ? "Killed by the sandbox memory limit."
          : "Killed by the sandbox time limit.",
      });
    }

    const firstFailure = results.find((item) => item.status !== "ACCEPTED");
    let overall: Verdict = firstFailure?.status ?? "ACCEPTED";
    if (!firstFailure && results.length < request.tests.length) {
      overall = result.oomKilled
        ? "MEMORY_LIMIT_EXCEEDED"
        : result.timedOut
          ? "TIME_LIMIT_EXCEEDED"
          : "SYSTEM_ERROR";
    }

    const outcomes: JudgeTestOutcome[] = results.map((item) => ({
      position: item.position,
      status: item.status,
      runtimeMs: Math.max(0, Math.round(item.runtimeMs)),
      memoryKb: Math.max(0, Math.round(item.memoryKb)),
      message: item.message ? truncate(item.message, 2048) : null,
    }));

    const runtimeMs = outcomes.length
      ? Math.max(...outcomes.map((item) => item.runtimeMs))
      : null;
    const memoryKb = outcomes.length
      ? Math.max(...outcomes.map((item) => item.memoryKb))
      : null;

    return {
      status: overall,
      passedTests: outcomes.filter((item) => item.status === "ACCEPTED").length,
      totalTests: request.tests.length,
      runtimeMs,
      memoryKb,
      compileOutput: null,
      errorMessage:
        overall === "SYSTEM_ERROR"
          ? "The judge could not complete this run."
          : null,
      results: outcomes,
      runStdout: runOutput.stdout,
      runStderr: runOutput.stderr,
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
