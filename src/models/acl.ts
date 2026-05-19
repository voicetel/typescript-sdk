import type { CidrEntry } from "./common.js";

/** Body for `POST /v2.2/acl` (add) and `DELETE /v2.2/acl` (remove). */
export interface AclModifyRequest {
  acl: CidrEntry[];
}

/** Response data for `GET /v2.2/acl`. */
export interface AclListData {
  acl: CidrEntry[];
}

/** Response data for `POST /v2.2/acl`. */
export interface AclAddData {
  added: CidrEntry[];
}

/** Response data for `DELETE /v2.2/acl`. */
export interface AclRemoveData {
  removed: CidrEntry[];
}

/** Reasons the server may reject a CIDR. */
export type AclFailureReason =
  | "DB Insert failed"
  | "DB delete failed"
  | "Invalid mask: must be /8, /16, /24, or /32"
  | "CIDR range must be routable";

/** A CIDR that was rejected, with the reason. */
export interface AclFailedEntry {
  cidr: string;
  reason: AclFailureReason;
}

/**
 * Data payload included in a 409 response from `POST`/`DELETE /v2.2/acl`.
 *
 * Surfaces *both* the entries that succeeded and the entries that failed,
 * so callers can reconcile partial outcomes.
 */
export interface AclConflictData {
  added?: CidrEntry[];
  removed?: CidrEntry[];
  failed?: AclFailedEntry[];
}
