import type { PhoneNumber } from "./common.js";

/** Body for `POST /v2.2/e911/validations`. */
export interface E911AddressRequest {
  address1: string;
  /** Apartment/suite/floor; may be empty. */
  address2?: string;
  city: string;
  /** Two-letter US state code. */
  state: string;
  zip: string;
}

/** Body for `POST /v2.2/e911` (validate + provision in one call). */
export interface E911CreateRequest {
  /** 10-digit TN owned by the authenticated account. */
  dn: PhoneNumber;
  callername: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

/** Body for `PUT /v2.2/e911/{dn}`. */
export interface E911ProvisionByIdRequest {
  callername: string;
  /** From `POST /v2.2/e911/validations`. */
  addressid: number;
}

/**
 * An e911 record bound to a TN.
 *
 * Note: requests take a 10-digit TN; responses return the 11-digit E.164 US
 * form (country code 1 prepended), e.g. `"12015551234"`.
 */
export interface E911Entry {
  /** 11-digit TN (E.164 US form, leading 1). */
  dn: string;
  callername: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

/** Result from `POST /v2.2/e911/validations`. */
export interface E911ValidatedAddress {
  /** Upstream address ID. */
  addressid: number;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

/** Response data for `GET /v2.2/e911`. */
export interface E911AllData {
  records: E911Entry[];
}

/**
 * Response data for `GET /v2.2/e911/{dn}`, `POST /v2.2/e911`, `PUT /v2.2/e911/{dn}`.
 */
export interface E911RecordData {
  record: E911Entry;
}

/** Response data for `POST /v2.2/e911/validations`. */
export interface E911ValidateData {
  address: E911ValidatedAddress;
}
