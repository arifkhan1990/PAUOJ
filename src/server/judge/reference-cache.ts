import { createHash } from "node:crypto";
import { getRedis } from "@/server/redis";

const REFERENCE_CACHE_TTL_SECONDS = 60 * 60;

export type CachedReference = {
  language: string;
  source: string;
  sqlScript: boolean;
};

function cacheKey(reference: CachedReference, stdin: string): string {
  const digest = createHash("sha256")
    .update(
      JSON.stringify([
        reference.language,
        reference.sqlScript,
        reference.source,
        stdin,
      ]),
    )
    .digest("hex");
  return `pauoj:reference-output:${digest}`;
}

/**
 * Deterministic cache key for a reference run. The reference source, language,
 * script mode and the input all change the expected output, so all four are
 * part of the hash.
 */
export function referenceCacheKey(
  reference: CachedReference,
  stdin: string,
): string {
  return cacheKey(reference, stdin);
}

/**
 * Successful reference output for the same input, or null on a miss or when
 * Redis is unavailable. An empty string is a valid hit.
 */
export async function getCachedExpectedOutput(
  reference: CachedReference,
  stdin: string,
): Promise<string | null> {
  try {
    return await getRedis().get(cacheKey(reference, stdin));
  } catch {
    return null;
  }
}

/**
 * Cache only successful output for one hour. Failures are never cached, and a
 * Redis outage must not fail the run.
 */
export async function setCachedExpectedOutput(
  reference: CachedReference,
  stdin: string,
  stdout: string,
): Promise<void> {
  try {
    await getRedis().set(
      cacheKey(reference, stdin),
      stdout,
      "EX",
      REFERENCE_CACHE_TTL_SECONDS,
    );
  } catch {
    // Best-effort cache; the judge run already succeeded.
  }
}
