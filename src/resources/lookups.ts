import type { Transport } from "../transport.js";
import type { CnamData, LrnLookupData } from "../models/lookups.js";

/** CNAM and LRN dips. Each call costs money; rate them per call rather than fanning out blindly. */
export class LookupsService {
  constructor(private readonly t: Transport) {}

  cnam(number: string, opts?: { signal?: AbortSignal }): Promise<CnamData> {
    return this.t.request<CnamData>({ method: "GET", path: `/v2.2/cnam/${number}`, ...opts });
  }

  /** `ani` is the presented caller ANI (10-digit TN), used only for billing/auth. */
  lrn(number: string, ani: string, opts?: { signal?: AbortSignal }): Promise<LrnLookupData> {
    return this.t.request<LrnLookupData>({
      method: "GET",
      path: `/v2.2/lrn/${number}/${ani}`,
      ...opts,
    });
  }
}
