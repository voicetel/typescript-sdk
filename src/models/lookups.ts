import type { PhoneNumber } from "./common.js";

/** Response data for `GET /v2.2/cnam/{number}`. */
export interface CnamData {
  cnam?: string;
  number: PhoneNumber;
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
  lrn: LrnData;
}
