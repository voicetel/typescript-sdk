import type { Transport } from "../transport.js";
import type { CarrierData, CnamData, LrnLookupData } from "../models/lookups.js";

/** CNAM, carrier & line-type, and LRN dips. Each call costs money; rate them per call rather than fanning out blindly. */
export class LookupsService {
  constructor(private readonly t: Transport) {}

  cnam(number: string, opts?: { signal?: AbortSignal }): Promise<CnamData> {
    return this.t.request<CnamData>({ method: "GET", path: `/v2.2/cnam/${encodeURIComponent(number)}`, ...opts });
  }

  /**
   * Carrier and line-type lookup (`GET /v2.2/carrier/{number}`). Billed per
   * lookup at the account's CNAM rate. The fields inside `carrier` keep the
   * upstream carrier's snake_case names (`mobile_country_code`,
   * `mobile_network_code`, `error_code`) — they are not renamed.
   */
  carrier(number: string, opts?: { signal?: AbortSignal }): Promise<CarrierData> {
    return this.t.request<CarrierData>({
      method: "GET",
      path: `/v2.2/carrier/${encodeURIComponent(number)}`,
      ...opts,
    });
  }

  /** `ani` is the presented caller ANI (10-digit TN), used only for billing/auth. */
  lrn(number: string, ani: string, opts?: { signal?: AbortSignal }): Promise<LrnLookupData> {
    return this.t.request<LrnLookupData>({
      method: "GET",
      path: `/v2.2/lrn/${encodeURIComponent(number)}/${encodeURIComponent(ani)}`,
      ...opts,
    });
  }
}
