import type { Transport } from "../transport.js";
import type {
  GatewayAddRequest,
  GatewayEntry,
  GatewayNumbersData,
  GatewayUpdateRequest,
  GatewaysListData,
} from "../models/gateways.js";

/** Outbound termination gateways. */
export class GatewaysService {
  constructor(private readonly t: Transport) {}

  list(opts?: { signal?: AbortSignal }): Promise<GatewaysListData> {
    return this.t.request<GatewaysListData>({ method: "GET", path: "/v2.2/gateways", ...opts });
  }

  add(body: GatewayAddRequest, opts?: { signal?: AbortSignal }): Promise<GatewayEntry> {
    return this.t.request<GatewayEntry>({ method: "POST", path: "/v2.2/gateways", body, ...opts });
  }

  get(id: number, opts?: { signal?: AbortSignal }): Promise<GatewayEntry> {
    return this.t.request<GatewayEntry>({ method: "GET", path: `/v2.2/gateways/${id}`, ...opts });
  }

  update(
    id: number,
    body: GatewayUpdateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<GatewayEntry> {
    return this.t.request<GatewayEntry>({
      method: "PUT",
      path: `/v2.2/gateways/${id}`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  remove(id: number, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({ method: "DELETE", path: `/v2.2/gateways/${id}`, ...opts });
  }

  numbers(id: number, opts?: { signal?: AbortSignal }): Promise<GatewayNumbersData> {
    return this.t.request<GatewayNumbersData>({
      method: "GET",
      path: `/v2.2/gateways/${id}/numbers`,
      ...opts,
    });
  }
}
