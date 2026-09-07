import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  let body: Partial<ApiResponse<T>> = {};
  try {
    body = await response.json();
  } catch {
    // Non-JSON error body (e.g. a raw 502/504 from a proxy) — fall through
    // to the generic message below.
  }

  if (
    !response.ok ||
    !body.success ||
    body.data === undefined ||
    body.data === null
  ) {
    const message =
      body.message ||
      (body as unknown as { detail?: string }).detail ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status, body.errors ?? []);
  }

  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  // For file uploads — request() skips the JSON Content-Type for FormData
  // bodies so the browser can set its own multipart/form-data boundary.
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: "POST",
      body: formData,
    }),
};
