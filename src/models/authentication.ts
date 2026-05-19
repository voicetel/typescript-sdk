import type { CidrEntry } from "./common.js";

/** 0=Digest, 1=IP Auth, 2=Digest OR IP, 3=Digest AND IP. */
export type AuthType = 0 | 1 | 2 | 3;

/** Body for `PUT /v2.2/auth`. */
export interface AuthPutRequest {
  authType?: AuthType;
  /** 6-10 alphanumeric chars; at least one letter and one number. */
  password?: string;
}

/** Response data for `GET /v2.2/auth`. */
export interface AuthGetData {
  authType: AuthType;
  authTypeDescription: string;
  acl: CidrEntry[];
}

/** One field's change record, returned by `PUT /v2.2/auth`. */
export interface AuthUpdatedEntry {
  field: "authType" | "password";
  /** Present when echoing is safe (authType); omitted for password. */
  value?: number;
}

/** Response data for `PUT /v2.2/auth`. */
export interface AuthPutData {
  updated: AuthUpdatedEntry[];
}

/** Data payload included in a 409 from `PUT /v2.2/auth`. */
export interface AuthPutConflictData {
  updated?: AuthUpdatedEntry[];
}
