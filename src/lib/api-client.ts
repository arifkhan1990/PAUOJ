export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string; details?: unknown };
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "Request failed. Please try again.",
      response.status,
      payload?.error?.details,
    );
  }

  if (!payload) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
      response.status,
    );
  }

  return payload.data;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}

/** GET a paginated list and keep the envelope meta (total/page/totalPages). */
export async function apiGetPage<T>(
  path: string,
): Promise<{
  items: T[];
  meta: { total: number; page: number; totalPages: number };
}> {
  const response = await fetch(path, { credentials: "same-origin" });

  let payload: (ApiEnvelope<T[]> & { meta?: Record<string, unknown> }) | null =
    null;
  try {
    payload = (await response.json()) as ApiEnvelope<T[]> & {
      meta?: Record<string, unknown>;
    };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "Request failed. Please try again.",
      response.status,
      payload?.error?.details,
    );
  }
  if (!payload) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
      response.status,
    );
  }

  const meta = payload.meta ?? {};
  return {
    items: payload.data,
    meta: {
      total: Number(meta.total ?? payload.data.length),
      page: Number(meta.page ?? 1),
      totalPages: Number(meta.totalPages ?? 1),
    },
  };
}
