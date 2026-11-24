import { z } from "zod";

export const contestTeamCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Team name is too short.")
    .max(40, "Team name is too long."),
});

export const contestTeamJoinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, "Enter the team invite code.")
    .max(32, "That invite code is not valid."),
});

export const contestTeamInviteSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Enter a username.")
    .max(80, "That username is too long."),
});

export const contestTeamInviteDecisionSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export const contestSponsorRequestSchema = z.object({
  name: z.string().trim().min(2, "Sponsor name is too short.").max(80),
  tier: z.enum(["TITLE", "GOLD", "SILVER", "COMMUNITY"]),
  websiteUrl: z.url("Enter a valid website URL.").max(300).optional().or(z.literal("")),
  logoUrl: z.url("Enter a valid logo URL.").max(500).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  amountBdt: z.coerce.number().int().min(0).max(10_000_000).optional(),
});

export const contestHostRequestSchema = z
  .object({
    title: z.string().trim().min(5, "Title is too short.").max(120),
    description: z
      .string()
      .trim()
      .min(40, "Describe the contest in at least 40 characters.")
      .max(20_000),
    bannerUrl: z
      .url("Enter a valid banner URL.")
      .max(500)
      .refine((value) => /^https?:\/\//i.test(value), "Use an http(s) URL.")
      .optional()
      .or(z.literal("")),
    format: z.enum(["SINGLE", "GROUP"]).default("SINGLE"),
    division: z.enum(["OPEN", "DIV1", "DIV2", "DIV3", "DIV4"]).default("OPEN"),
    startAt: z.iso.datetime({ offset: true, message: "Choose a valid start." }),
    endAt: z.iso.datetime({ offset: true, message: "Choose a valid end." }),
    teamSize: z.coerce.number().int().min(2).max(6).default(3),
    expectedParticipants: z.coerce.number().int().min(10).max(10_000),
    sponsorNote: z.string().trim().max(1000).optional().or(z.literal("")),
    contactEmail: z.email("Enter a valid contact email.").max(200),
    contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
    feeBdt: z.coerce.number().int().min(3000).max(5000),
    paymentReference: z
      .string()
      .trim()
      .min(4, "Add the payment transaction reference.")
      .max(80),
    agreement: z.literal(true, {
      message: "Confirm the organiser rules and fee before submitting.",
    }),
  })
  .superRefine((value, context) => {
    if (new Date(value.endAt).getTime() <= new Date(value.startAt).getTime()) {
      context.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time must be after the start time.",
      });
    }
    const duration =
      (new Date(value.endAt).getTime() - new Date(value.startAt).getTime()) /
      60_000;
    if (duration < 15 || duration > 24 * 60) {
      context.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "A contest must run between 15 minutes and 24 hours.",
      });
    }
  });

export const contestIntegrityEventSchema = z.object({
  type: z.enum([
    "TAB_HIDDEN",
    "PASTE",
    "COPY",
    "CONTEXT_MENU",
    "PRINT",
    "FULLSCREEN_EXIT",
    "RAPID_SUBMIT",
  ]),
  problemId: z.uuid().optional(),
  detail: z.string().trim().max(200).optional().or(z.literal("")),
});

export const contestStaffInviteSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Enter a username.")
    .max(80, "That username is too long."),
  role: z.enum([
    "DIRECTOR",
    "SETTER",
    "EDITORIAL",
    "TESTER",
    "OBSERVER",
  ]),
});

export const contestStaffNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a note.")
    .max(2000, "Keep notes under 2000 characters."),
  problemId: z.uuid().optional().or(z.literal("")),
});

export const contestCandidateSchema = z.object({
  problemId: z.uuid("Choose a problem."),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const contestCandidateDecisionSchema = z.object({
  status: z.enum(["SHORTLISTED", "REJECTED"]),
});

export const contestSponsorDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (value.decision === "REJECTED" && !value.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Explain why the sponsorship was rejected.",
      });
    }
  });

export const contestHostDecisionSchema = z
  .object({
    decision: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (value.decision === "REJECTED" && !value.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Explain why the hosting request was rejected.",
      });
    }
  });

export const contestSeriesUpdateSchema = z.object({
  isActive: z.boolean(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  minute: z.coerce.number().int().min(0).max(55).optional(),
  durationMinutes: z.coerce.number().int().min(30).max(300).optional(),
});

export type ContestTeamCreateInput = z.infer<typeof contestTeamCreateSchema>;
export type ContestTeamJoinInput = z.infer<typeof contestTeamJoinSchema>;
export type ContestTeamInviteInput = z.infer<typeof contestTeamInviteSchema>;
export type ContestTeamInviteDecisionInput = z.infer<
  typeof contestTeamInviteDecisionSchema
>;
export type ContestSponsorRequestInput = z.infer<
  typeof contestSponsorRequestSchema
>;
export type ContestHostRequestInput = z.infer<typeof contestHostRequestSchema>;
export type ContestIntegrityEventInput = z.infer<
  typeof contestIntegrityEventSchema
>;
export type ContestStaffInviteInput = z.infer<typeof contestStaffInviteSchema>;
export type ContestStaffNoteInput = z.infer<typeof contestStaffNoteSchema>;
export type ContestCandidateInput = z.infer<typeof contestCandidateSchema>;
