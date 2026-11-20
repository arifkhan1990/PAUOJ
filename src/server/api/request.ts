import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return request.headers.get("x-real-ip")?.slice(0, 64) ?? null;
}

export function getClientUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent")?.slice(0, 300) ?? null;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowed = new Set<string>([new URL(request.url).origin]);
  try {
    allowed.add(new URL(process.env.APP_URL ?? "").origin);
  } catch {
    // APP_URL is optional for this check; request origin is authoritative.
  }
  return allowed.has(origin);
}
