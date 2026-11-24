import { randomUUID } from "node:crypto";
import type { RunResult } from "@/lib/types";
import type { JudgeLanguage } from "@/server/judge/types";
import { enqueueRun } from "@/server/judge/queue";
import { getRedis } from "@/server/redis";

const RUN_TTL_SECONDS = 900;

function key(userId: string, runId: string): string {
  return `pauoj:run:${userId}:${runId}`;
}

export type CreateRunInput = {
  userId: string;
  language: JudgeLanguage;
  source: string;
  stdin: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  sqlScript?: boolean;
};

export async function createRun(input: CreateRunInput): Promise<string> {
  const runId = randomUUID();
  const initial: RunResult = {
    id: runId,
    status: "QUEUED",
    stdout: "",
    stderr: "",
    compileOutput: "",
    runtimeMs: null,
    memoryKb: null,
    finished: false,
  };
  await getRedis().set(
    key(input.userId, runId),
    JSON.stringify(initial),
    "EX",
    RUN_TTL_SECONDS,
  );
  await enqueueRun({ runId, ...input });
  return runId;
}

export async function getRun(
  userId: string,
  runId: string,
): Promise<RunResult | null> {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return null;
  const raw = await getRedis().get(key(userId, runId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunResult;
  } catch {
    return null;
  }
}

export async function updateRun(
  userId: string,
  runId: string,
  patch: Partial<RunResult>,
): Promise<void> {
  const current = await getRun(userId, runId);
  if (!current) return;
  const next: RunResult = { ...current, ...patch, id: runId };
  await getRedis().set(
    key(userId, runId),
    JSON.stringify(next),
    "EX",
    RUN_TTL_SECONDS,
  );
}
