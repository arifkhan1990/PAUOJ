import { z } from "zod";
import {
  MAX_PHONE_INPUT_LENGTH,
  MAX_PROFILE_SKILL_LENGTH,
  MAX_PROFILE_SKILLS,
  normalizeSkills,
  parsePhone,
  TSHIRT_SIZE_VALUES,
  USER_STATUS_VALUES,
} from "@/lib/profile-fields";
import {
  parseGitHub,
  parseLinkedIn,
  parseWebsite,
  type ProfileLinkParse,
} from "@/lib/profile-links";

function profileLinkField(parse: (raw: string) => ProfileLinkParse) {
  return z
    .string()
    .trim()
    .superRefine((raw, ctx) => {
      const result = parse(raw);
      if (!result.ok) ctx.addIssue({ code: "custom", message: result.message });
    })
    .transform((raw) => {
      const result = parse(raw);
      return result.ok ? result.value : null;
    })
    .optional();
}

function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .transform((value) => (value === "" ? null : value))
    .optional();
}

function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .enum(values)
    .or(z.literal(""))
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "" ? null : value,
    );
}

const phoneField = z
  .string()
  .trim()
  .max(
    MAX_PHONE_INPUT_LENGTH,
    `Phone must be at most ${MAX_PHONE_INPUT_LENGTH} characters.`,
  )
  .superRefine((raw, ctx) => {
    const result = parsePhone(raw);
    if (!result.ok) ctx.addIssue({ code: "custom", message: result.message });
  })
  .transform((raw) => {
    const result = parsePhone(raw);
    return result.ok ? result.value : null;
  })
  .optional();

const skillsField = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Each skill needs at least 1 character.")
      .max(
        MAX_PROFILE_SKILL_LENGTH,
        `Each skill must be at most ${MAX_PROFILE_SKILL_LENGTH} characters.`,
      ),
  )
  .max(
    MAX_PROFILE_SKILLS,
    `Add at most ${MAX_PROFILE_SKILLS} skills.`,
  )
  .transform(normalizeSkills)
  .optional();

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be at most 24 characters.")
  .regex(
    /^[a-z0-9_]+$/,
    "Use only lowercase letters, numbers and underscores.",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(64, "Name must be at most 64 characters."),
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your username or email.")
    .max(255),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(64),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  country: z.string().trim().max(64).optional().or(z.literal("")),
  institution: z.string().trim().max(120).optional().or(z.literal("")),
  website: profileLinkField(parseWebsite),
  github: profileLinkField(parseGitHub),
  linkedin: profileLinkField(parseLinkedIn),
  address: optionalText(200, "Address"),
  phone: phoneField,
  currentStatus: optionalEnum(USER_STATUS_VALUES),
  companyName: optionalText(120, "Company name"),
  jobTitle: optionalText(120, "Job title"),
  skills: skillsField,
  tshirtSize: optionalEnum(TSHIRT_SIZE_VALUES),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "The reset link is invalid.").max(500),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "The verification link is invalid.").max(500),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
