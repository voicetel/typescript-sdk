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
  /** Prefix or wildcard pattern; `201`, `201555`, `201555*`. */
  tnMask: string;
  /** Maximum results, 1–1000. Defaults to 10. */
  quantity?: number;
  /** 2-letter US state or Canadian province code. */
  province?: string;
  /** Rate-center name. */
  rateCenter?: string;
  /** LATA code. */
  lata?: string;
  signal?: AbortSignal;
}

/** Filters for {@link INumberingService.coverage}. */
export interface CoverageQuery {
  /** Aggregation dimension. */
  countBy: "state" | "city" | "rateCenter" | "npanxx" | "block";
  /** Filter: state or province code (e.g. NJ). */
  locState?: string;
  /** Filter: city name. */
  city?: string;
  /** Filter: rate-center abbreviation. */
  rcAbbre?: string;
  /** Filter: area code. */
  npa?: string;
  /** Filter: LATA code. */
  lata?: string;
  signal?: AbortSignal;
}

/** Inventory searches, orders, and port-ins. */
export class INumberingService {
  constructor(private readonly t: Transport) {}

  searchInventory(args: InventoryQuery): Promise<InventorySearchData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<InventorySearchData>({
      method: "GET",
      path: "/v2.2/inventory",
      query: {
        tnMask: args.tnMask,
        quantity: args.quantity,
        province: args.province,
        rateCenter: args.rateCenter,
        lata: args.lata,
      },
      ...opts,
    });
  }

  coverage(args: CoverageQuery): Promise<InventoryCoverageData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<InventoryCoverageData>({
      method: "GET",
      path: "/v2.2/inventory/coverage",
      query: {
        countBy: args.countBy,
        locState: args.locState,
        city: args.city,
        rcAbbre: args.rcAbbre,
        npa: args.npa,
        lata: args.lata,
      },
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

  /** `id` is the 5-character alphanumeric pid from the port list response. */
  port(id: string, opts?: { signal?: AbortSignal }): Promise<PortDetailData> {
    return this.t.request<PortDetailData>({
      method: "GET",
      path: `/v2.2/ports/${encodeURIComponent(id)}`,
      ...opts,
    });
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
      path: `/v2.2/ports/availability/${encodeURIComponent(number)}`,
      ...opts,
    });
  }
}
