import type { PhoneNumber } from "./common.js";

/** Response data for `GET /v2.2/cnam/{number}`. */
export interface CnamData {
  cnam?: string;
  number: PhoneNumber;
}

/**
 * Carrier and line-type details. Field names are the upstream carrier
 * lookup's — snake_case on the wire, deliberately **not** renamed.
 */
export interface CarrierInfo {
  /** Carrier or network name. */
  name?: string | null;
  /** Line type, such as voip, landline or mobile. */
  type?: string | null;
  /** Mobile country code, on mobile numbers. */
  mobile_country_code?: string | null;
  /** Mobile network code, on mobile numbers. */
  mobile_network_code?: string | null;
  /** Error code when carrier details could not be determined. */
  error_code?: number | null;
}

/**
 * Response data for `GET /v2.2/carrier/{number}`. Billed per lookup at the
 * account's CNAM rate.
 */
export interface CarrierData {
  number: PhoneNumber;
  carrier: CarrierInfo;
}

/** LRN dip result. */
export interface LrnData {
  /** Local Routing Number. */
  lrn?: string;
  state?: string;
  city?: string;
  /** Rate center. */
  rc?: string;
  lata?: string;
  ocn?: string;
  lec?: string;
  lecType?: string;
  jurisdiction?: string;
  /** "Y"/"N" — local to the ANI's rate center. */
  local?: string;
}

/** Response data for `GET /v2.2/lrn/{number}/{ani}`. */
export interface LrnLookupData {
  ani: PhoneNumber;
  destination: PhoneNumber;
  /** Null when the dip found no record (still 200, still billed). */
  lrn: LrnData | null;
}
