/** A 10-digit telephone number, e.g. `"2015550123"`. */
export type PhoneNumber = string;

/** A single CIDR row used by the ACL endpoint. */
export interface CidrEntry {
  /** IPv4 CIDR. Routable public; mask /8, /16, /24, or /32. */
  cidr: string;
}

/**
 * Generic error envelope returned for non-2xx responses, e.g.
 * `{ "status": "error", "error": { "code": 400, "message": "Field Required: number" } }`.
 *
 * The SDK normally throws {@link ApiError} (which carries this object as
 * `error.body`, and surfaces `error.code` / `error.message` directly) rather
 * than returning it.
 */
export interface ErrorResponse {
  status: "error";
  error: {
    code: number;
    message: string;
  };
}
