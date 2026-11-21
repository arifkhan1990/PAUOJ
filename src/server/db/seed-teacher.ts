import { eq } from "drizzle-orm";
import { hashPassword } from "@/server/auth/password";
import { getDb } from "./index";
import { contests, problems, users } from "./schema";
import { DEMO_PASSWORD } from "./seed-demo";

type DemoTeacher = {
  email: string;
  username: string;
  displayName: string;
  institution: string;
};

async function ensureTeacher(teacher: DemoTeacher): Promise<string> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, teacher.email))
    .limit(1);
  const existing = rows[0];
  if (existing) {
    if (existing.role !== "TEACHER") {
      await db
        .update(users)
        .set({
          role: "TEACHER",
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
    }
    return existing.id;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [created] = await db
    .insert(users)
    .values({
      username: teacher.username,
      email: teacher.email,
      displayName: teacher.displayName,
      passwordHash,
      role: "TEACHER",
      institution: teacher.institution,
      emailVerifiedAt: new Date(),
    })
    .returning({ id: users.id });
  if (!created) throw new Error("Could not create the demo teacher.");
  process.stdout.write(
    `Created teacher ${teacher.username} <${teacher.email}>\n`,
  );
  return created.id;
}

export async function seedTeacher(): Promise<string> {
  const primary = await ensureTeacher({
    email: "teacher@pauoj.local",
    username: "teacher",
    displayName: "Nadia Rahman",
    institution: "PrimeAsia University",
  });
  // The publication review needs two setters other than the author. A fresh
  // demo therefore ships with two teachers plus the admin account.
  await ensureTeacher({
    email: "teacher2@pauoj.local",
    username: "teacher2",
    displayName: "Imran Hossain",
    institution: "PrimeAsia University",
  });
  return primary;
}

export async function attachTeacherDemoContent(teacherId: string): Promise<void> {
  const db = getDb();
  await db
    .update(problems)
    .set({ authorId: teacherId })
    .where(eq(problems.slug, "reverse-array"));
  await db
    .update(contests)
    .set({ createdBy: teacherId })
    .where(eq(contests.slug, "pau-intra-2026"));
}
