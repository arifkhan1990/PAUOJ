export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export const errors = {
  unauthorized: () => new ApiError("UNAUTHORIZED", "Please sign in to continue.", 401),
  forbidden: (message = "You do not have permission to do that.") =>
    new ApiError("FORBIDDEN", message, 403),
  notFound: (message = "Not found.") => new ApiError("NOT_FOUND", message, 404),
  conflict: (message = "That already exists.") =>
    new ApiError("CONFLICT", message, 409),
  validation: (message = "Invalid input.", details?: unknown) =>
    new ApiError("VALIDATION_ERROR", message, 422, details),
  rateLimited: (message = "Too many requests. Please wait a moment.") =>
    new ApiError("RATE_LIMITED", message, 429),
  unavailable: (message = "Service temporarily unavailable.") =>
    new ApiError("SERVICE_UNAVAILABLE", message, 503),
};
