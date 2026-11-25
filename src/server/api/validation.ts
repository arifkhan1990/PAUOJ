import type { NextRequest } from "next/server";
import { z, type ZodType } from "zod";
import { ApiError } from "./errors";

/** Every JSON endpoint accepts at most 1 MiB; larger bodies are refused. */
export const MAX_JSON_BODY_BYTES = 1024 * 1024;

function payloadTooLarge(): ApiError {
  return new ApiError(
    "PAYLOAD_TOO_LARGE",
    "Request body must be 1 MiB or smaller.",
    413,
  );
}

/** content-length is a cheap early reject, but a chunked body omits it. */
function declaredBodyBytes(request: NextRequest): number | null {
  const header = request.headers.get("content-length");
  if (header === null) return null;
  const value = Number(header);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export async function parseJson<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  const declared = declaredBodyBytes(request);
  if (declared !== null && declared > MAX_JSON_BODY_BYTES) {
    throw payloadTooLarge();
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  // Re-check the decoded bytes so chunked bodies cannot bypass the cap.
  if (utf8Bytes(raw) > MAX_JSON_BODY_BYTES) throw payloadTooLarge();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Some fields are invalid.",
      422,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return parsed.data;
}

export function parseQuery<T>(
  request: NextRequest,
  schema: ZodType<T>,
): T {
  const values = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Invalid query parameters.",
      422,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return parsed.data;
}

/** Blank query values mean "unset" instead of coercing to 0. */
function blankToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export const paginationSchema = z.object({
  page: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).max(10000).default(1),
  ),
  pageSize: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).max(50).default(20),
  ),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

function optionalQueryInt(min: number, max: number) {
  return z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(min).max(max).optional(),
  );
}

export const rankSortSchema = z.enum(["points", "solved", "name"]);

/** Query for the global ranking board: filters, sort and pagination. */
export const rankQuerySchema = paginationSchema
  .extend({
    q: z.string().trim().max(100).optional(),
    institution: z.string().trim().max(120).optional(),
    country: z.string().trim().max(80).optional(),
    minSolved: optionalQueryInt(0, 100000),
    maxSolved: optionalQueryInt(0, 100000),
    sort: z.preprocess(blankToUndefined, rankSortSchema.default("points")),
  })
  .refine(
    (query) =>
      query.minSolved === undefined ||
      query.maxSolved === undefined ||
      query.minSolved <= query.maxSolved,
    {
      message: "minSolved must be less than or equal to maxSolved.",
      path: ["minSolved"],
    },
  );

export type RankQuery = z.infer<typeof rankQuerySchema>;

export const ratingSortSchema = z.enum(["rating", "peak", "contests", "name"]);

/** Query for the contest rating board: rated-only filters, sort and pagination. */
export const ratingQuerySchema = paginationSchema
  .extend({
    q: z.string().trim().max(100).optional(),
    institution: z.string().trim().max(120).optional(),
    country: z.string().trim().max(80).optional(),
    minRating: optionalQueryInt(0, 10000),
    maxRating: optionalQueryInt(0, 10000),
    sort: z.preprocess(blankToUndefined, ratingSortSchema.default("rating")),
  })
  .refine(
    (query) =>
      query.minRating === undefined ||
      query.maxRating === undefined ||
      query.minRating <= query.maxRating,
    {
      message: "minRating must be less than or equal to maxRating.",
      path: ["minRating"],
    },
  );

export type RatingQuery = z.infer<typeof ratingQuerySchema>;

export function toOffset(input: PaginationInput): number {
  return (input.page - 1) * input.pageSize;
}

export function pageMeta(
  total: number,
  input: PaginationInput,
): { page: number; pageSize: number; total: number; totalPages: number } {
  return {
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}
