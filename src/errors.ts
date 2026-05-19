/**
 * Classifies a VoiceTel API failure so callers can `switch` on it without
 * having to inspect raw HTTP status codes.
 */
export type ErrorKind =
  | "unknown"
  | "bad_request"
  | "authentication"
  | "permission_denied"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "server";

export interface ApiErrorOptions {
  kind?: ErrorKind;
  statusCode?: number;
  code?: string;
  body?: unknown;
  cause?: unknown;
}

/**
 * Thrown whenever the VoiceTel API responds with a non-2xx status, or when
 * the underlying fetch fails before a response is received.
 *
 * For non-2xx responses, `body` carries the parsed JSON payload (object, array,
 * or raw string). Useful for 409 conflicts where the server returns structured
 * detail about partial successes — see {@link AclConflictData} and
 * {@link AuthPutConflictData}.
 */
export class ApiError extends Error {
  readonly kind: ErrorKind;
  readonly statusCode: number;
  readonly code: string | undefined;
  readonly body: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind ?? "unknown";
    this.statusCode = options.statusCode ?? 0;
    this.code = options.code;
    this.body = options.body;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/** Type guard — `true` when `err` is an {@link ApiError} with `kind === "rate_limit"`. */
export const isRateLimit = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.kind === "rate_limit";

/** Type guard — `true` when `err` is an {@link ApiError} with `kind === "not_found"`. */
export const isNotFound = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.kind === "not_found";

/** Type guard — `true` when `err` is an {@link ApiError} with `kind === "authentication"`. */
export const isAuthentication = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.kind === "authentication";

/** Type guard — `true` when `err` is an {@link ApiError} with `kind === "conflict"`. */
export const isConflict = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.kind === "conflict";

/** @internal — maps an HTTP status to the most specific {@link ErrorKind}. */
export function kindFromStatus(status: number): ErrorKind {
  if (status === 400) return "bad_request";
  if (status === 401) return "authentication";
  if (status === 403) return "permission_denied";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limit";
  if (status >= 500 && status < 600) return "server";
  return "unknown";
}
