import type { PhoneNumber } from "./common.js";

// ----------------------------------------------------------------- requests ---

/** Body for `POST /v2.2/numbers`. */
export interface NumberAddRequest {
  number: PhoneNumber;
  /** Gateway route ID; defaults to 4 (DID). */
  route?: number;
}

/** Body for `PUT /v2.2/numbers/{number}/route`. */
export interface NumberRouteRequest {
  route: number;
}

/** Body for `PUT /v2.2/numbers/{number}/cnam` — inbound CNAM toggle. */
export interface NumberCnamRequest {
  enabled: boolean;
}

/** Body for `PUT /v2.2/numbers/{number}/lidb` — outbound caller name. */
export interface NumberLidbRequest {
  /** Outbound caller name; max 15 alphanumeric chars. */
  cnam: string;
  customerOrderReference?: string;
}

/** Body for `PUT /v2.2/numbers/{number}/fax`. */
export interface NumberFaxRequest {
  email: string;
}

/** Body for `PUT /v2.2/numbers/{number}/forward`. */
export interface NumberForwardRequest {
  /** 10-digit destination number. */
  destination: PhoneNumber;
}

/** Body for `PUT /v2.2/numbers/{number}/translation`. */
export interface NumberTranslationRequest {
  /** DNIS translation. Digits and `#` only. */
  translation: string;
}

/** Body for `PUT /v2.2/numbers/{number}/sms`. */
export interface NumberSmsRequest {
  type: "email" | "webhook" | "sip";
  /** Destination — email, webhook URL, or IP, depending on `type`. */
  resource: string;
}

/**
 * Body for `PATCH /v2.2/numbers/{number}/messaging`.
 *
 * At least one of `routeIn` / `routeOut` must be set.
 */
export interface NumberMessagingPatchRequest {
  /** `numbers_sms` row id for inbound. `0` to detach. */
  routeIn?: number;
  /** Outbound carrier id. */
  routeOut?: number;
}

/** Body for `PUT /v2.2/numbers/{number}/messaging-campaign`. */
export interface NumberCampaignAssignRequest {
  /** 7-character TCR campaign id, uppercase alphanumeric. */
  campaignId: string;
}

/** Body for `PATCH /v2.2/numbers/{number}` — move to another account. */
export interface NumberMoveRequest {
  /** Destination account id (numeric username). */
  accountId: number;
  route: number;
}

/** Body for `PATCH /v2.2/numbers/{number}/port-out-pin`. */
export interface PortOutPinUpdateRequest {
  /** 4-digit numeric. */
  pin: string;
}

// ------------------------------------------------------- entities & responses ---

/**
 * Per-number routing/feature state returned by `GET /v2.2/numbers` and
 * `GET /v2.2/numbers/{number}`.
 */
export interface NumberDetail {
  number: PhoneNumber;
  translated: PhoneNumber;
  /** Gateway id the number is currently routed to. */
  route: number;
  /** Gateway address (IP[:port]) or system route name. */
  gateway: string | null;
  /** Inbound CNAM lookup enabled. */
  cnam: boolean;
  forward: boolean;
  /** Forwarding destination — 10-digit TN — or null when disabled. */
  forwardTo: string | null;
  /** Outbound messaging carrier identifier. */
  carrier: number;
  smsEnabled: boolean;
  faxEnabled: boolean;
}

/** The campaign currently bound to a number, with CSP-side status. */
export interface CampaignBinding {
  id: string;
  /** "A" or "B" — messaging path. */
  network: "A" | "B";
  /** CSP status — ACTIVE, EXPIRED, SUSPENDED, ... */
  status: string;
  /** CNP id from the CSP sharing record. */
  upstreamCnpId: string;
}

/** Current messaging routing state for one number. */
export interface NumberMessagingState {
  number: PhoneNumber;
  /** Present and `false` when the number is not on the authenticated account. */
  onAccount?: boolean;
  enabled: boolean;
  /** Internal carrier identifier on the numbers row. */
  carrier: number;
  /** `numbers_sms` row id used for inbound routing; `0` = none configured. */
  routeIn: number;
  /** URL or endpoint that receives inbound messages. */
  resource: string;
  /** Messaging path. `null` when carrier is 0 or any non-messaging carrier. */
  network: "A" | "B" | null;
  /** Bound campaign with CSP-side status. `null` when no binding exists. */
  campaign: CampaignBinding | null;
}

// -------------------------------------------------- per-operation responses ---

/** Response data for `POST /v2.2/numbers`. */
export interface NumberAddData {
  number: PhoneNumber;
  route: number;
}

/** Response data for `PUT /v2.2/numbers/{number}/cnam`. */
export interface NumberCnamData {
  number: PhoneNumber;
  cnam: boolean;
}

/** Response data for `GET`/`PUT /v2.2/numbers/{number}/fax`. */
export interface NumberFaxData {
  number: PhoneNumber;
  email: string;
}

/** Response data for `PUT /v2.2/numbers/{number}/forward`. */
export interface NumberForwardData {
  number: PhoneNumber;
  /** 10-digit TN, or `null` when disabled. */
  forwardTo: string | null;
}

/** Response data for `PUT /v2.2/numbers/{number}/lidb`. */
export interface NumberLidbData {
  number: PhoneNumber;
  /** Sanitised caller name (max 15 alphanumeric). */
  cnam: string;
  /** Echoed if supplied; auto-generated as `<username>-<unix-ts>` otherwise. */
  customerOrderReference: string;
  /** Status returned by the LIDB network. "Success" = accepted. */
  carrierStatus: string;
}

/** Response data for `PATCH /v2.2/numbers/{number}/messaging`. */
export interface NumberMessagingPatchData {
  number: PhoneNumber;
  /** Subset of `{ "routeIn", "routeOut" }` the request changed. */
  updated: Array<"routeIn" | "routeOut">;
}

/** Response data for `PATCH /v2.2/numbers/{number}`. */
export interface NumberMoveData {
  number: PhoneNumber;
  accountId: number;
  route: number;
}

/** Response data for `PUT /v2.2/numbers/{number}/route`. */
export interface NumberRouteData {
  number: PhoneNumber;
  route: number;
}

/** Response data for `GET`/`PUT /v2.2/numbers/{number}/sms`. */
export interface NumberSmsData {
  number: PhoneNumber;
  type: "email" | "webhook" | "sip" | "unknown";
  resource: string;
}

/** Response data for `PUT /v2.2/numbers/{number}/translation`. */
export interface NumberTranslationData {
  number: PhoneNumber;
  translation: PhoneNumber;
}

/** Response data for `PUT /v2.2/numbers/{number}/messaging-campaign`. */
export interface NumberMessagingCampaignAssignData {
  number: PhoneNumber;
  campaignId: string;
  /** 17 = path A, 19 = path B. */
  carrier: number;
  /** Messaging path the campaign resolves to. */
  network: "A" | "B" | null;
  /** CNP id from the CSP sharing record. */
  upstreamCnpId: string | null;
  /** Path the number was on before this assignment, if any. */
  previousNetwork: "A" | "B" | "unknown" | null;
  /** `true` if a prior conflicting binding was disabled to allow this one. */
  previousNetworkCleared: boolean;
}

/** Response data for `DELETE /v2.2/numbers/{number}/messaging-campaign`. */
export interface NumberMessagingCampaignUnassignData {
  number: PhoneNumber;
  campaignId: string;
  network: "A" | "B" | null;
  upstreamCnpId: string | null;
  /** Always `true` on a 200 response. */
  unassigned: boolean;
}

/** One row in {@link NumbersMessagingCampaignUnassignData.failed}. */
export interface CampaignUnassignFailure {
  number: PhoneNumber;
  reason: string;
}

/** Response data for `DELETE /v2.2/numbers/messaging-campaign` (bulk). */
export interface NumbersMessagingCampaignUnassignData {
  campaignId: string;
  network: "A" | "B" | null;
  upstreamCnpId: string | null;
  /** Numbers whose binding was successfully removed. */
  unassignedNumbers: string[];
  failed?: CampaignUnassignFailure[];
}

/** Response data for `GET /v2.2/numbers`. */
export interface NumbersListData {
  numbers: NumberDetail[];
}

/** Response data for `GET /v2.2/numbers/messaging`. */
export interface NumbersMessagingListData {
  numbers: NumberMessagingState[];
}

/** Response data for `PATCH /v2.2/numbers/{number}/port-out-pin`. */
export interface PortOutPinUpdateData {
  number: PhoneNumber;
  portOutPin: string;
}
