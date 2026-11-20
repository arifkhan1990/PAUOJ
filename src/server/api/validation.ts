import type { NextRequest } from "next/server";
import { z, type ZodType } from "zod";
import { ApiError } from "./errors";

export async function parseJson<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
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

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

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
