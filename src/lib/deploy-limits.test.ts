import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The app accepts a 5 MiB DM image plus multipart framing (6 MiB preflight).
 * Caddy must allow that body before the request reaches the route; otherwise
 * production returns 413 while local dev works. Keep the two deploy paths in
 * sync with the app limit.
 */
const REQUIRED_BODY_BYTES = 6 * 1024 * 1024;

function declaredMaxBytes(file: string): number {
  const source = readFileSync(join(process.cwd(), file), "utf8");
  const match = /max_size\s+(\d+)MB/.exec(source);
  if (!match) throw new Error(`No max_size MB directive in ${file}`);
  // Caddy's MB suffix is decimal (1 MB = 1,000,000 bytes).
  return Number(match[1]) * 1_000_000;
}

describe("deploy request body limits", () => {
  it("lets the compose Caddy accept a 5 MiB DM image", () => {
    expect(declaredMaxBytes("deploy/Caddyfile")).toBeGreaterThanOrEqual(
      REQUIRED_BODY_BYTES,
    );
  });

  it("lets the shared-host Caddy site accept a 5 MiB DM image", () => {
    expect(declaredMaxBytes("deploy/deploy-shared.sh")).toBeGreaterThanOrEqual(
      REQUIRED_BODY_BYTES,
    );
  });
});
