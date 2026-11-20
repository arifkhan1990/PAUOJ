import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  JUDGE_IMAGE: z.string().min(1).default("pauoj/judge:latest"),
  JUDGE_SWIFT_IMAGE: z.string().min(1).default("pauoj/judge-swift:latest"),
  JUDGE_WORK_DIR: z.string().min(1).default("/tmp/pauoj-judge"),
  JUDGE_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(2),
  JUDGE_COMPILE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  MAIL_FROM: z.string().default("PAU OJ <noreply@pauoj.local>"),
  SEED_ADMIN_USERNAME: z.string().min(1).default("admin"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@pauoj.local"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  SEED_DEMO_DATA: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  cached = result.data;
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}
