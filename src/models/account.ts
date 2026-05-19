/** Per-service rates on an account. Read-only for non-administrators. */
export interface AccountRates {
  /** Per CNAM lookup, USD. */
  cnam?: number;
  /** International call cap, USD/min. */
  intlMax?: number;
  /** Domestic per-minute, USD/min. */
  nibble?: number;
  /** Per LRN lookup, USD. */
  lrn?: number;
  /** Per fax page, USD. */
  fax?: number;
  /** Toll-free adjustment, USD/min. */
  tfAdj?: number;
  /** Per DID per month, USD. */
  did?: number;
  /** Per MMS, USD. */
  mms?: number;
  /** Per SMS, USD. */
  sms?: number;
}

/** Per-service feature flags. `true` = enabled on this account. */
export interface AccountServices {
  e911?: boolean;
  /** Inbound CNAM lookups enabled. */
  cnam?: boolean;
  bypassMedia?: boolean;
  /** International calling enabled. */
  intl?: boolean;
  /** Remote Caller ID display enabled. */
  rcid?: boolean;
  mms?: boolean;
  dialer?: boolean;
  sms?: boolean;
}

/** The profile returned by `GET /v2.2/account`. */
export interface AccountData {
  username?: string;
  name?: string;
  email?: string;
  enabled?: boolean;
  /** ISO 8601 creation timestamp. */
  created?: string;
  /** Current balance, USD. */
  cash?: number;
  /** Default outbound caller ID — 10-digit TN. */
  callerId?: string;
  /** IANA timezone identifier. */
  timezone?: string;
  /** Authentication mode (0=Digest, 1=IP, 2=Digest OR IP, 3=Digest AND IP). */
  authType?: 0 | 1 | 2 | 3;
  /** Max concurrent calls. */
  ccs?: number;
  notify?: boolean;
  /** Balance threshold (USD) below which notifications fire. */
  notifyThreshold?: number;
  rates?: AccountRates;
  services?: AccountServices;
}

/** A single credit row in {@link AccountCreditsData.credits}. */
export interface CreditEntry {
  /** ISO 8601 timestamp the credit was applied. */
  date: string;
  /** `true` = invoice has been paid; `false` = still outstanding. */
  paid: boolean;
  /** Credit amount in USD. */
  amount: number;
}

/** Status of a payment row. */
export type PaymentStatus =
  | "Completed"
  | "Pending"
  | "Reversed"
  | "Refunded"
  | "Failed"
  | "Denied"
  | "Canceled_Reversal";

/** A single payment row in {@link AccountPaymentsData.payments}. */
export interface PaymentEntry {
  /** PayPal transaction ID. */
  transactionId?: string;
  /** ISO 8601 timestamp of the payment. */
  date: string;
  /** PayPal email of the payer. */
  payerEmail?: string;
  status: PaymentStatus;
  /** Payment amount in USD. */
  amount: number;
}

/**
 * Per-call billing summary inside a CDR row.
 *
 * All numeric-looking fields (`dur`, `ba`, `nr`) are intentionally strings to
 * preserve exact precision on the wire — parse with `BigInt` or `Number` only
 * after you know rounding is acceptable.
 */
export interface CdrEntryValue {
  /** Billed call duration in seconds. */
  dur?: string;
  /** Destination 10-digit TN. */
  dst?: string;
  /** Billed amount, USD. */
  ba?: string;
  /** Nibble rate, USD/min. */
  nr?: string;
  /** URL-encoded display name (CNAM at call time). */
  cn?: string;
  /** IPv4 of the leg. */
  ip?: string;
  /** Caller ID 10-digit TN. */
  cid?: string;
}

/** A single CDR row. */
export interface CdrEntry {
  id: string;
  /** Composite key — `[accountUsername, startEpochUnixSeconds]`. */
  key: string[];
  value: CdrEntryValue;
}

/** Response data for `GET /v2.2/account/cdr`. */
export interface AccountCdrData {
  cdr: CdrEntry[];
  /** Echo of the `start` query parameter (Unix seconds). */
  start: number;
  /** Echo of the `end` query parameter (Unix seconds). */
  end: number;
}

/** Response data for `GET /v2.2/account/credits`. */
export interface AccountCreditsData {
  credits: CreditEntry[];
}

/** Response data for `GET /v2.2/account/payments`. */
export interface AccountPaymentsData {
  payments: PaymentEntry[];
}

/** A single monthly-recurring charge row in {@link AccountMrcData.charges}. */
export interface MrcCharge {
  amount: number;
  description?: string;
}

/** Response data for `GET /v2.2/account/recurring-charges`. */
export interface AccountMrcData {
  charges: MrcCharge[];
  total: number;
}

/** Response data for `GET /v2.2/account/registration`. */
export interface AccountRegistrationData {
  /** SIP User-Agent string. */
  agent?: string;
  /** SIP URI of the registered endpoint. */
  uri?: string;
  /** Seconds until the registration expires. */
  expires?: number;
}

/** Body for `POST /v2.2/account` (admin-only sub-account creation). */
export interface AccountAddRequest {
  username: number;
  name: string;
  email: string;
  /** Billing account. Defaults to `username`. */
  masterAccount?: number;
}

/** Response data for `POST /v2.2/account`. */
export interface AccountAddData {
  username?: string;
  name?: string;
  email?: string;
  masterAccount?: string;
  /** Auto-generated initial password. */
  password?: string;
}

/** Body for `PUT /v2.2/account`. Only the fields you set are sent. */
export interface AccountPutRequest {
  notify?: boolean;
  notifyThreshold?: number;
  timezone?: string;
  callerId?: string;
  /** Admin only. */
  e911?: boolean;
  /** Admin only. */
  intl?: boolean;
  /** Admin only. */
  sms?: boolean;
  /** Admin only. */
  mms?: boolean;
  /** Admin only — concurrent-call cap. */
  ccs?: number;
}

/** Response data for `PUT /v2.2/account`. */
export interface AccountPutData {
  updated: string[];
}

/** Body for `POST /v2.2/accounts` (public sign-up). */
export interface AccountSignupRequest {
  name: string;
  email: string;
  /** Optional promotional code. */
  promo?: string;
}

/** Response data for `POST /v2.2/accounts`. */
export interface AccountSignupData {
  username?: string;
  name?: string;
  email?: string;
  /** Auto-generated initial password. */
  password?: string;
}

/** Body for `POST /v2.2/account/recovery` (no auth required). */
export interface AccountRecoverRequest {
  email: string;
}

/** Response data for `POST /v2.2/account/recovery`. */
export interface AccountRecoverData {
  message?: string;
}

/** Response data for `POST /v2.2/account/api-key`. */
export interface AccountApiKeyData {
  apikey: string;
}
