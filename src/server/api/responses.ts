import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { postgresErrorCode } from "@/lib/db-errors";
import { ApiError } from "./errors";

type ApiMeta = Record<string, unknown>;

export function apiOk(
  data: unknown,
  meta?: ApiMeta,
  status = 200,
): NextResponse {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function apiCreated(data: unknown, meta?: ApiMeta): NextResponse {
  return apiOk(data, meta, 201);
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Some fields are invalid.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 422 },
    );
  }

  const postgresCode = postgresErrorCode(error);
  if (postgresCode) {
    if (postgresCode === "42P01" || postgresCode === "42703") {
      console.error("Database migration missing for this request", error);
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "This feature is not ready yet. Apply the latest database migration.",
          },
        },
        { status: 503 },
      );
    }
    if (postgresCode === "23505") {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "That record already exists.",
          },
        },
        { status: 409 },
      );
    }
    if (postgresCode === "23503") {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "This record is still referenced elsewhere.",
          },
        },
        { status: 409 },
      );
    }
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on our side.",
      },
    },
    { status: 500 },
  );
}
