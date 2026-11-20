import { redirect } from "next/navigation";
import { getCurrentUser, type SafeUser } from "./session";

export async function requireUser(nextPath?: string): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${target}`);
  }
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function requireTeacher(): Promise<SafeUser> {
  const user = await requireUser("/teacher");
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export function isAdmin(user: SafeUser | null): boolean {
  return user?.role === "ADMIN";
}
