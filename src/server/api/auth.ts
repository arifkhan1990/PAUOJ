import type { NextRequest } from "next/server";
import { getCurrentUser, type SafeUser } from "@/server/auth/session";
import { errors } from "./errors";
import { isSameOrigin } from "./request";

export async function optionalApiUser(): Promise<SafeUser | null> {
  return getCurrentUser();
}

export async function requireApiUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw errors.unauthorized();
  return user;
}

export async function requireApiAdmin(): Promise<SafeUser> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") throw errors.forbidden();
  return user;
}

export async function requireApiStaff(): Promise<SafeUser> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN" && user.role !== "TEACHER") {
    throw errors.forbidden();
  }
  return user;
}

export function assertSameOrigin(request: NextRequest): void {
  if (!isSameOrigin(request)) {
    throw errors.forbidden("Cross-origin request blocked.");
  }
}
