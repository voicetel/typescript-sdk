import type { PhoneNumber } from "./common.js";

/**
 * Body for `POST /v2.2/messages`. A non-empty `mediaUrls` switches the
 * message type to MMS.
 *
 * Wire field names are `fromNumber` / `toNumber` — `from` / `to` would collide
 * with TypeScript / JavaScript reserved words.
 */
export interface MessageSendRequest {
  /** 10-digit TN on the authenticated account. */
  fromNumber: PhoneNumber;
  /** 10-digit destination TN. */
  toNumber: PhoneNumber;
  /**
   * UTF-8 message body. Required for SMS; optional for MMS, where a
   * media-only message is valid (max 2048 characters when sent as MMS,
   * 400 otherwise).
   */
  text?: string;
  /**
   * MMS subject line (MMS only).
   *
   * @deprecated Not delivered on most messaging routes; accepted for
   * compatibility only — do not rely on it.
   */
  subject?: string;
  /**
   * Publicly-reachable http(s) media URLs — at least one when present;
   * presence makes this an MMS.
   */
  mediaUrls?: string[];
}

/** Body for `POST /v2.2/messaging/brands`. */
export interface MessagingBrandCreateRequest {
  /** Starts with `B`, alphanumeric. */
  messagingBrandId: string;
  messagingBrandName: string;
  messagingBrandDescription?: string;
}

/**
 * Body for `POST /v2.2/messaging/campaigns`.
 *
 * `campaignClassName` (from the campaign registry) and `campaignStartDate` (today)
 * are auto-populated if omitted.
 */
export interface MessagingCampaignCreateRequest {
  messagingBrandId: string;
  externalCampaignId: string;
  campaignDescription: string;
  campaignClassName?: string;
  /** ISO 8601 timestamp. */
  campaignStartDate?: string;
}

/**
 * Per-record value inside a {@link MessageRecord}. Shape depends on the
 * requested message type:
 *   - `sms` / `mms`: `sourceNumber`, `destinationNumber`, `direction`, `rate`, `message`
 *   - `dlr`:         `sourceNumber`, `destinationNumber`
 */
export interface MessageRecordValue {
  sourceNumber?: string | null;
  destinationNumber?: string | null;
  /** "in" or "out" (sms/mms only). */
  direction?: "in" | "out";
  /** Billed rate per message — string for precision (sms/mms only). */
  rate?: string | null;
  /** Far-end number (sms/mms only). */
  number?: string | null;
  /** Message body (sms/mms only); may be empty for a media-only MMS. */
  message?: string | null;
  /** The delivery receipt as received, including `stat:` and `err:` (dlr only). */
  messageText?: string | null;
  /** Id of the message this receipt is for (dlr only). */
  transactionGUID?: string | null;
  /** Present on some receipts for multi-part messages (dlr only). */
  concatenatedMessage?: string | null;
  /**
   * Media attachments (mms only). Inbound: one object per media file (with
   * `contentFile`, `Content-Type`, `fileName`, `extension`). Outbound: the
   * submitted media URL(s) — a string or an array of strings.
   */
  attachments?: Record<string, unknown>[] | string | string[] | null;
  /** Subject, if one was sent or received (mms only). */
  subject?: string | null;
  /** Address the send request came from (outbound sms only). */
  ip?: string | null;
}

/** One row in {@link MessageHistoryData.messages}. */
export interface MessageRecord {
  id: string;
  /**
   * Composite range key. For `sms`/`mms`: `[destinationNumber, timestamp]`.
   * For `dlr`: `[accountId, fromNumberWithCountryCode, timestamp]`.
   */
  key: Array<string | number | null>;
  value: MessageRecordValue;
}

/** Response data for `GET /v2.2/messages`. */
export interface MessageHistoryData {
  number: PhoneNumber;
  /** Echo of the requested message type. */
  type: "sms" | "mms" | "dlr";
  fromTs: number;
  toTs: number;
  messages: MessageRecord[];
}

/** Response data for `POST /v2.2/messages`. */
export interface MessageSendData {
  /** Provider transaction id; use as a search key in delivery-receipt webhooks. */
  id: string;
  type: "sms" | "mms";
  fromNumber: PhoneNumber;
  toNumber: PhoneNumber;
  /** Billed SMS segments; 1 for MMS. */
  parts: number;
  subject?: string;
  mediaUrls?: string[];
}

/** Status payload for brand or campaign registration. */
export interface RegistrationResult {
  /** HTTP status code as string; "200" on success. */
  statusCode: string;
  /** "Success" on success. */
  status: string;
}

/** Response data for `POST /v2.2/messaging/brands`. */
export interface MessagingBrandCreateData {
  result: RegistrationResult;
}

/** Response data for `POST /v2.2/messaging/campaigns`. */
export interface MessagingCampaignCreateData {
  result: RegistrationResult;
}

/** One carrier's latest DCA decision in {@link CampaignDca}. */
export interface CampaignDcaCarrier {
  /** Carrier name, e.g. "T-Mobile". */
  carrier: string;
  /** Carrier decision: ACTIVE, REJECTED, SUSPENDED, UNSUSPENDED or TERMINATED. */
  status: string;
  /** The reviewer's note, as given. */
  detail: string;
  /** ISO 8601 timestamp of the decision. */
  updatedAt: string;
}

/** Carrier (DCA) review progress for a campaign. `null` for `CAMPAIGN_INVALID_ID`. */
export interface CampaignDca {
  /** True once every carrier has a DCA assigned to review the campaign. */
  electionComplete: boolean;
  /** Carriers with a DCA assigned so far (null when unavailable). */
  electedCarriers: string[] | null;
  /** Each carrier DCA decision received, latest per carrier. */
  carriers: CampaignDcaCarrier[];
}

/** A single campaign and its currently-bound numbers. */
export interface CampaignStatusItem {
  id: string;
  /**
   * Campaign status: CAMPAIGN_DCA_COMPLETE (ready: carrier review finished, numbers
   * assigned), CAMPAIGN_DCA_COMPLETE_NO_NUMBERS_ASSIGNED, CAMPAIGN_PENDING_DCA (active
   * at the campaign registry, but carrier (DCA) review is not finished yet; numbers
   * cannot be enabled until it is), CAMPAIGN_DCA_REJECTED (a carrier's DCA rejected or
   * suspended the campaign; see dca.carriers), CAMPAIGN_<registry status>, or
   * CAMPAIGN_INVALID_ID.
   */
  status: string;
  numbers: string[];
  /** Carrier (DCA) review progress. `null` for `CAMPAIGN_INVALID_ID`. */
  dca?: CampaignDca | null;
}

/** Response data for `GET /v2.2/messaging/campaigns`. */
export interface MessagingCampaignStatusData {
  campaigns: CampaignStatusItem[];
}
