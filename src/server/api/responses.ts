import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

type ApiMeta = Record<string, unknown>;

type PostgresError = {
  code?: string;
  constraint_name?: string;
  detail?: string;
};

function isPostgresError(error: unknown): error is PostgresError {
  return typeof error === "object" && error !== null && "code" in error;
}

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

  if (isPostgresError(error)) {
    if (error.code === "23505") {
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
    if (error.code === "23503") {
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
