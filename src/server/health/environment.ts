import { readFileSync } from "node:fs";

/** Kernel listen/accept backlog settings exposed on `/health`. */
export type NetworkSettings = {
  somaxconn: number;
  tcpMaxSynBacklog: number;
};

/** Injectable file reader so the `/proc` lookups are testable without the host. */
export type ReadFile = (path: string) => string;

/** Redis key the host healthcheck writer stores the shared edge memory budget in. */
export const EDGE_CADDY_MEMORY_KEY = "pauoj:edge:caddy:memory";

const SOMAXCONN_PATH = "/proc/sys/net/core/somaxconn";
const TCP_MAX_SYN_BACKLOG_PATH = "/proc/sys/net/ipv4/tcp_max_syn_backlog";

const readFileUtf8: ReadFile = (path) => readFileSync(path, "utf8");

/**
 * Accept only non-negative safe integers. `/proc` values are newline-terminated
 * decimal counters; anything else (empty, signed, float, garbage) reads as 0.
 */
function parseNonNegativeInt(raw: string | null | undefined): number {
  if (typeof raw !== "string") return 0;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 0;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : 0;
}

function readIntFile(path: string, readFile: ReadFile): number {
  try {
    return parseNonNegativeInt(readFile(path));
  } catch {
    return 0;
  }
}

/**
 * Read the container's effective network backlog limits.
 *
 * Never throws: a missing, unreadable or non-numeric file degrades that field to
 * 0, so `/health` keeps reporting on restricted hosts and test environments.
 */
export function readNetworkSettings(
  readFile: ReadFile = readFileUtf8,
): NetworkSettings {
  return {
    somaxconn: readIntFile(SOMAXCONN_PATH, readFile),
    tcpMaxSynBacklog: readIntFile(TCP_MAX_SYN_BACKLOG_PATH, readFile),
  };
}

/**
 * Parse the shared edge memory budget from Redis.
 *
 * Returns bytes as a non-negative safe integer, or 0 when the key is missing or
 * the value is not a plain byte count.
 */
export function parseEdgeMemoryBytes(raw: string | null): number {
  return parseNonNegativeInt(raw);
}
