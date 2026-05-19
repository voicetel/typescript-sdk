/** A 10-digit telephone number, e.g. `"2015551234"`. */
export type PhoneNumber = string;

/** A single CIDR row used by the ACL endpoint. */
export interface CidrEntry {
  /** IPv4 CIDR. Routable public; mask /8, /16, /24, or /32. */
  cidr: string;
}

/**
 * Generic error envelope returned for non-2xx responses.
 *
 * The SDK normally throws {@link ApiError} (which carries this object as
 * `error.body`) rather than returning it.
 */
export interface ErrorResponse {
  status?: string;
  code?: string;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}
