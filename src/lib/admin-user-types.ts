import type { TshirtSize, UserCurrentStatus } from "@/lib/profile-fields";
import type { UserRole } from "@/lib/types";

export type AdminUserDetail = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  rating: number;
  isBanned: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  bio: string | null;
  country: string | null;
  institution: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  address: string | null;
  phone: string | null;
  currentStatus: UserCurrentStatus | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: string[];
  tshirtSize: TshirtSize | null;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};
