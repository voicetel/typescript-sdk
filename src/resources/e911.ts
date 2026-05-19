import type { Transport } from "../transport.js";
import type {
  E911AddressRequest,
  E911AllData,
  E911CreateRequest,
  E911ProvisionByIdRequest,
  E911RecordData,
  E911ValidateData,
} from "../models/e911.js";

/**
 * e911 records and address validation.
 *
 * Requests take a 10-digit `dn`; responses return the 11-digit E.164 US form.
 */
export class E911Service {
  constructor(private readonly t: Transport) {}

  list(opts?: { signal?: AbortSignal }): Promise<E911AllData> {
    return this.t.request<E911AllData>({ method: "GET", path: "/v2.2/e911", ...opts });
  }

  create(body: E911CreateRequest, opts?: { signal?: AbortSignal }): Promise<E911RecordData> {
    return this.t.request<E911RecordData>({ method: "POST", path: "/v2.2/e911", body, ...opts });
  }

  validate(
    body: E911AddressRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<E911ValidateData> {
    return this.t.request<E911ValidateData>({
      method: "POST",
      path: "/v2.2/e911/validations",
      body,
      ...opts,
    });
  }

  get(dn: string, opts?: { signal?: AbortSignal }): Promise<E911RecordData> {
    return this.t.request<E911RecordData>({ method: "GET", path: `/v2.2/e911/${dn}`, ...opts });
  }

  provision(
    dn: string,
    body: E911ProvisionByIdRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<E911RecordData> {
    return this.t.request<E911RecordData>({
      method: "PUT",
      path: `/v2.2/e911/${dn}`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  remove(dn: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({ method: "DELETE", path: `/v2.2/e911/${dn}`, ...opts });
  }
}
