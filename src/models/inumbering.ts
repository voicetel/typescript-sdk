import type { PhoneNumber } from "./common.js";

/** USPS direction abbreviations used in port-in addresses. */
export type StreetDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

/** Subscriber name type on a port-in. */
export type NameType = "business" | "residential";

/**
 * Body for `POST /v2.2/orders`. `numbers` may contain plain TN strings or
 * `{ number, route }` objects to override the gateway per TN.
 *
 * Total entries: 1..100.
 */
export interface OrderCreateRequest {
  numbers: Array<PhoneNumber | OrderNumberSpec>;
}

/** Per-number routing override inside {@link OrderCreateRequest}. */
export interface OrderNumberSpec {
  number: PhoneNumber;
  /** Gateway ID on this account; defaults to 4. */
  route?: number;
}

/** LIDB feature for a port-in TN. */
export interface PortFeatureLidb {
  /** Outbound caller name (max 15 chars). */
  name: string;
}

/** Routing feature for a port-in TN. */
export interface PortFeatureRouting {
  gatewayId: number;
}

/** SMS feature for a port-in TN. */
export interface PortFeatureSms {
  /** 10DLC campaign ID (e.g. "C123456"). */
  campaignId?: string;
}

/** Per-TN feature configuration applied after the port completes. */
export interface PortFeature {
  number: PhoneNumber;
  routing?: PortFeatureRouting;
  lidb?: PortFeatureLidb;
  sms?: PortFeatureSms;
}

/**
 * Body for `POST /v2.2/ports`.
 *
 * `streetPrefix` / `streetSuffix` are one of {@link StreetDirection}.
 */
export interface PortSubmitRequest {
  /** 10-digit TNs to port (toll-free not supported). */
  did: PhoneNumber[];
  /** Subscriber name exactly as on the losing carrier bill. */
  name: string;
  nameType: NameType;
  /** Billing TN on the losing carrier bill. */
  lcBtn: string;
  /** Account number from the losing carrier bill. */
  lcAccountNumber: string;
  streetNumber: string;
  /** Street name. */
  street: string;
  /** USPS street type abbreviation (ST, AVE, BLVD, ...). */
  streetType: string;
  city: string;
  /** Two-letter state abbreviation. */
  state: string;
  zip: string;
  country: string;
  /** Full name authorised to sign the LOA. */
  authPerson: string;
  streetPrefix?: StreetDirection;
  streetSuffix?: StreetDirection;
  floor?: string;
  room?: string;
  building?: string;
  /** Unit designator (e.g. "APT 3" or "STE 200"). */
  unitValue?: string;
  /** Optional ISO 8601 desired port date. Blank = standard SLA. */
  desiredDueDate?: string;
  /** Optional port-out PIN required by the losing carrier. */
  pin?: string;
  features?: PortFeature[];
}

/** A single TN available for assignment. */
export interface InventoryItem {
  number: PhoneNumber;
  rateCenter: string;
  city: string;
  /** Two-letter state/province. */
  province: string;
  /** LATA code. */
  lata: string;
}

/**
 * One aggregated availability bucket. Which fields are populated depends on
 * the `countBy` dimension on the query.
 */
export interface InventoryCoverageItem {
  count: number;
  /** Area code (countBy=npanxx). */
  npa?: string;
  /** Exchange code (countBy=npanxx). */
  nxx?: string;
  /** Thousands-block (countBy=block). */
  block?: string;
  /** City (countBy=city). */
  city?: string;
  /** Rate-center abbreviation (countBy=rateCenter). */
  rcAbbre?: string;
  lata?: string;
  /** State/province (countBy=state). */
  locState?: string;
}

/** One row in the port-status list. */
export interface PortSummary {
  status: string;
  id?: string;
  pid?: string;
  /** Firm Order Commitment date (YYYYMMDD). */
  foc?: string;
  createdAt?: string;
  message?: string;
  /** Related support ticket conversation URL. */
  supportUrl?: string;
}

/** Full record for a single port-in. */
export interface PortDetail {
  status: string;
  id?: string;
  pid?: string;
  /** Name on the porting account at submission. */
  name?: string;
  /** Notification email at submission. */
  email?: string;
  foc?: string;
  createdAt?: string;
  numbers?: string[];
  message?: string;
}

/** Response data for `GET /v2.2/inventory`. */
export interface InventorySearchData {
  numbers: InventoryItem[];
}

/** Response data for `GET /v2.2/inventory/coverage`. */
export interface InventoryCoverageData {
  coverage: InventoryCoverageItem[];
}

/** One row in {@link OrderCreateData.failed}. */
export interface OrderFailedEntry {
  number: PhoneNumber;
  reason: string;
}

/** Response data for `POST /v2.2/orders`. */
export interface OrderCreateData {
  orderId: string;
  /** USD deducted from `accounts.cash`. */
  amountCharged: number;
  /** Numbers inserted into the account on success. */
  numbersOrdered: string[];
  failed?: OrderFailedEntry[];
}

/** Response data for `GET /v2.2/ports`. */
export interface PortListData {
  ports: PortSummary[];
}

/** Response data for `GET /v2.2/ports/{id}`. */
export interface PortDetailData {
  port: PortDetail;
}

/** Response data for `POST /v2.2/ports`. */
export interface PortSubmitData {
  /** 5-character port order ID. */
  pid: string;
  /** Support ticket ID. */
  ticket: number;
  message: string;
  /** LOA download URL. */
  loaUrl: string;
  /** Port status URL. */
  portUrl: string;
}

/** Response data for `GET /v2.2/ports/availability/{number}`. */
export interface PortAvailabilityData {
  number: PhoneNumber;
  portable: boolean;
  /** Service-provider name; null when unknown. */
  losingCarrier: string | null;
  /** Local Routing Number assigned to the destination switch (v2.2.10+); null when unavailable. */
  localRoutingNumber: string | null;
  /** Rate-center tier classification (v2.2.10+); null when unavailable. */
  rateCenterTier: string | null;
  /** When portable=false, the network-supplied reason; null when portable=true. */
  reason: string | null;
}
