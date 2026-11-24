import { eq } from "drizzle-orm";
import { z } from "zod";
import type { AdminUserDetail } from "@/lib/admin-user-types";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Full account detail for the admin user page. Selects explicit columns so
 * password hashes, session tokens and unsubscribe tokens never leave the DB.
 */
export async function getAdminUserDetail(
  id: string,
): Promise<AdminUserDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const rows = await getDb()
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      rating: users.rating,
      isBanned: users.isBanned,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      bio: users.bio,
      country: users.country,
      institution: users.institution,
      website: users.website,
      github: users.github,
      linkedin: users.linkedin,
      address: users.address,
      phone: users.phone,
      currentStatus: users.currentStatus,
      companyName: users.companyName,
      jobTitle: users.jobTitle,
      skills: users.skills,
      tshirtSize: users.tshirtSize,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    rating: row.rating,
    isBanned: row.isBanned,
    emailVerifiedAt: row.emailVerifiedAt
      ? row.emailVerifiedAt.toISOString()
      : null,
    createdAt: row.createdAt.toISOString(),
    bio: row.bio,
    country: row.country,
    institution: row.institution,
    website: row.website,
    github: row.github,
    linkedin: row.linkedin,
    address: row.address,
    phone: row.phone,
    currentStatus: row.currentStatus,
    companyName: row.companyName,
    jobTitle: row.jobTitle,
    skills: row.skills ?? [],
    tshirtSize: row.tshirtSize,
  };
}
