export const USER_STATUS_VALUES = [
  "STUDENT",
  "EMPLOYED",
  "FREELANCER",
  "JOB_SEEKER",
  "OTHER",
] as const;

export type UserCurrentStatus = (typeof USER_STATUS_VALUES)[number];

export const USER_STATUS_LABELS: Record<UserCurrentStatus, string> = {
  STUDENT: "Student",
  EMPLOYED: "Employed",
  FREELANCER: "Freelancer",
  JOB_SEEKER: "Job seeker",
  OTHER: "Other",
};

export const USER_STATUS_OPTIONS: { value: UserCurrentStatus; label: string }[] =
  USER_STATUS_VALUES.map((value) => ({
    value,
    label: USER_STATUS_LABELS[value],
  }));

export const TSHIRT_SIZE_VALUES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
] as const;

export type TshirtSize = (typeof TSHIRT_SIZE_VALUES)[number];

export const TSHIRT_SIZE_LABELS: Record<TshirtSize, string> = {
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
};

export const TSHIRT_SIZE_OPTIONS: { value: TshirtSize; label: string }[] =
  TSHIRT_SIZE_VALUES.map((value) => ({
    value,
    label: TSHIRT_SIZE_LABELS[value],
  }));

export const PRESENCE_VISIBILITY_VALUES = [
  "EVERYONE",
  "FOLLOWERS",
  "NOBODY",
] as const;

export type PresenceVisibility = (typeof PRESENCE_VISIBILITY_VALUES)[number];

export const PRESENCE_VISIBILITY_LABELS: Record<PresenceVisibility, string> = {
  EVERYONE: "Everyone",
  FOLLOWERS: "People who follow me",
  NOBODY: "Nobody",
};

export const PRESENCE_VISIBILITY_OPTIONS: {
  value: PresenceVisibility;
  label: string;
}[] = PRESENCE_VISIBILITY_VALUES.map((value) => ({
  value,
  label: PRESENCE_VISIBILITY_LABELS[value],
}));

export const MAX_PROFILE_SKILLS = 12;
export const MAX_PROFILE_SKILL_LENGTH = 30;
export const MAX_PHONE_INPUT_LENGTH = 20;

const PHONE_SEPARATORS = /[\s\-.()]/g;
const PHONE_CHARACTERS = /^\+?\d+$/;
const BD_LOCAL = /^01\d{9}$/;
const BD_WITH_COUNTRY_CODE = /^8801\d{9}$/;
const NON_PRINTABLE = /[\u0000-\u001F\u007F]/g;

export type PhoneParse =
  | { ok: true; value: string | null }
  | { ok: false; message: string };

const EMPTY_PHONE: PhoneParse = { ok: true, value: null };

function rejectPhone(message: string): PhoneParse {
  return { ok: false, message };
}

/**
 * Normalizes a phone number to E.164-ish `+<digits>`.
 * Accepts Bangladeshi local (01XXXXXXXXX) and 8801XXXXXXXXX forms plus
 * international numbers written with a leading `+`.
 */
export function parsePhone(raw: string): PhoneParse {
  const trimmed = raw.trim();
  if (trimmed === "") return EMPTY_PHONE;
  if (trimmed.length > MAX_PHONE_INPUT_LENGTH) {
    return rejectPhone(
      `Phone must be at most ${MAX_PHONE_INPUT_LENGTH} characters.`,
    );
  }

  const cleaned = trimmed.replace(PHONE_SEPARATORS, "");
  if (!PHONE_CHARACTERS.test(cleaned)) {
    return rejectPhone(
      "Phone can only contain digits and a leading +, with spaces, dashes, dots or parentheses.",
    );
  }

  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (cleaned.startsWith("+")) {
    if (digits.length < 8 || digits.length > 15) {
      return rejectPhone("Phone must have between 8 and 15 digits.");
    }
    return { ok: true, value: `+${digits}` };
  }

  if (BD_LOCAL.test(digits)) {
    return { ok: true, value: `+880${digits.slice(1)}` };
  }
  if (BD_WITH_COUNTRY_CODE.test(digits)) {
    return { ok: true, value: `+${digits}` };
  }

  return rejectPhone(
    "Enter a Bangladeshi number (01XXXXXXXXX) or an international number starting with +.",
  );
}

/**
 * Trims, collapses whitespace, drops control characters and removes
 * case-insensitive duplicates while keeping the first casing and order.
 */
export function normalizeSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = raw
      .replace(NON_PRINTABLE, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (value === "") continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
    if (result.length >= MAX_PROFILE_SKILLS) break;
  }

  return result;
}
