import type { Transport } from "../transport.js";
import type {
  InventoryCoverageData,
  InventorySearchData,
  OrderCreateData,
  OrderCreateRequest,
  PortAvailabilityData,
  PortDetailData,
  PortListData,
  PortSubmitData,
  PortSubmitRequest,
} from "../models/inumbering.js";

/** Filters for {@link INumberingService.searchInventory}. */
export interface InventoryQuery {
  npa?: number;
  nxx?: number;
  state?: string;
  ratecenter?: string;
  contains?: string;
  endswith?: string;
  limit?: number;
  signal?: AbortSignal;
}

/** Filters for {@link INumberingService.coverage}. */
export interface CoverageQuery {
  state?: string;
  ratecenter?: string;
  signal?: AbortSignal;
}

/** Inventory searches, orders, and port-ins. */
export class INumberingService {
  constructor(private readonly t: Transport) {}

  searchInventory(args: InventoryQuery = {}): Promise<InventorySearchData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<InventorySearchData>({
      method: "GET",
      path: "/v2.2/inventory",
      query: {
        npa: args.npa,
        nxx: args.nxx,
        state: args.state,
        ratecenter: args.ratecenter,
        contains: args.contains,
        endswith: args.endswith,
        limit: args.limit,
      },
      ...opts,
    });
  }

  coverage(args: CoverageQuery = {}): Promise<InventoryCoverageData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<InventoryCoverageData>({
      method: "GET",
      path: "/v2.2/inventory/coverage",
      query: { state: args.state, ratecenter: args.ratecenter },
      ...opts,
    });
  }

  /** Purchase new TNs. */
  order(body: OrderCreateRequest, opts?: { signal?: AbortSignal }): Promise<OrderCreateData> {
    return this.t.request<OrderCreateData>({
      method: "POST",
      path: "/v2.2/orders",
      body,
      ...opts,
    });
  }

  /** Every port-in record on the account. */
  ports(opts?: { signal?: AbortSignal }): Promise<PortListData> {
    return this.t.request<PortListData>({ method: "GET", path: "/v2.2/ports", ...opts });
  }

  port(id: number, opts?: { signal?: AbortSignal }): Promise<PortDetailData> {
    return this.t.request<PortDetailData>({ method: "GET", path: `/v2.2/ports/${id}`, ...opts });
  }

  submitPort(
    body: PortSubmitRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<PortSubmitData> {
    return this.t.request<PortSubmitData>({ method: "POST", path: "/v2.2/ports", body, ...opts });
  }

  portAvailability(
    number: string,
    opts?: { signal?: AbortSignal },
  ): Promise<PortAvailabilityData> {
    return this.t.request<PortAvailabilityData>({
      method: "GET",
      path: `/v2.2/ports/availability/${number}`,
      ...opts,
    });
  }
}
