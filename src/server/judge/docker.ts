import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { JudgeInfrastructureError } from "./types";

const DOCKER_BIN = process.env.DOCKER_BIN ?? "docker";
const OUTPUT_CAP = 64 * 1024;

type SpawnResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

function spawnDocker(args: string[], timeoutMs: number): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(DOCKER_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < OUTPUT_CAP) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < OUTPUT_CAP) stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new JudgeInfrastructureError(
          `Could not run Docker (${error.message}). Is Docker installed and reachable?`,
        ),
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr, timedOut });
    });
  });
}

export type ContainerOptions = {
  image: string;
  workDir: string;
  workDirReadOnly: boolean;
  resultsDir?: string;
  command: string[];
  memoryMb: number;
  timeoutMs: number;
  user?: string;
  readOnlyRootfs?: boolean;
  extraEnv?: Record<string, string>;
  noFileLimit?: number;
  tmpfsSizeMb?: number;
  capAdd?: string[];
};

export type ContainerResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  oomKilled: boolean;
};

export async function runContainer(
  options: ContainerOptions,
): Promise<ContainerResult> {
  const name = `pauoj-judge-${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const args = [
    "create",
    "--name",
    name,
    "--label",
    "pauoj.judge=1",
    "--network",
    "none",
    "--memory",
    `${options.memoryMb}m`,
    "--memory-swap",
    `${options.memoryMb}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "128",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--workdir",
    "/work",
    "-v",
    `${options.workDir}:/work:${options.workDirReadOnly ? "ro" : "rw"}`,
  ];

  if (options.capAdd && options.capAdd.length > 0) {
    for (const capability of options.capAdd) {
      args.push("--cap-add", capability);
    }
  }
  if (options.resultsDir) {
    args.push("-v", `${options.resultsDir}:/results:rw`);
  }
  if (options.readOnlyRootfs !== false) {
    args.push(
      "--read-only",
      "--tmpfs",
      `/tmp:rw,nosuid,nodev,size=${options.tmpfsSizeMb ?? 64}m`,
    );
  }
  if (options.user) {
    args.push("--user", options.user);
  }
  if (options.noFileLimit) {
    args.push("--ulimit", `nofile=${options.noFileLimit}:${options.noFileLimit}`);
  }

  args.push("-e", "HOME=/tmp", "-e", "TMPDIR=/tmp");
  for (const [key, value] of Object.entries(options.extraEnv ?? {})) {
    args.push("-e", `${key}=${value}`);
  }

  args.push(options.image, ...options.command);

  const created = await spawnDocker(args, 20_000);
  if (created.exitCode !== 0) {
    throw new JudgeInfrastructureError(
      `Docker could not create a judge container: ${created.stderr.trim() || "unknown error"}`,
    );
  }

  let timedOut = false;
  let stdout = "";
  let stderr = "";
  try {
    const started = await spawnDocker(
      ["start", "-a", name],
      options.timeoutMs,
    );
    timedOut = started.timedOut;
    stdout = started.stdout;
    stderr = started.stderr;
    if (timedOut) {
      await spawnDocker(["kill", name], 10_000);
    }
  } finally {
    const inspected = await spawnDocker(
      [
        "inspect",
        "--format",
        "{{.State.ExitCode}}|{{.State.OOMKilled}}",
        name,
      ],
      10_000,
    );
    let exitCode: number | null = null;
    let oomKilled = false;
    if (inspected.exitCode === 0) {
      const [rawExit, rawOom] = inspected.stdout.trim().split("|");
      const parsed = Number(rawExit);
      exitCode = Number.isFinite(parsed) ? parsed : null;
      oomKilled = rawOom === "true";
    }
    await spawnDocker(["rm", "-f", name], 15_000);
    return { exitCode, stdout, stderr, timedOut, oomKilled };
  }
}

export async function checkDocker(): Promise<string> {
  const result = await spawnDocker(
    ["info", "--format", "{{.ServerVersion}}"],
    10_000,
  );
  if (result.exitCode !== 0 || !result.stdout.trim()) {
    throw new JudgeInfrastructureError(
      `Docker is not available: ${result.stderr.trim() || "unknown error"}`,
    );
  }
  return result.stdout.trim();
}

export async function hasImage(image: string): Promise<boolean> {
  const result = await spawnDocker(["image", "inspect", image], 10_000);
  return result.exitCode === 0;
}
