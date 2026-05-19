import type { PhoneNumber } from "./common.js";

/** Body for `POST /v2.2/gateways`. */
export interface GatewayAddRequest {
  /** IP/hostname with optional `:port`; must be routable public IPv4. */
  gateway: string;
  /** Digits to prepend on outbound calls. */
  prefix?: string;
  /** Max concurrent calls; default 23, range 1..1000. */
  limit?: number;
}

/** Body for `PUT /v2.2/gateways/{id}`. */
export interface GatewayUpdateRequest {
  gateway?: string;
  prefix?: string;
  /** Range 1..1000. */
  limit?: number;
}

/** A single gateway row. */
export interface GatewayEntry {
  id?: number;
  /** Gateway IP:port or system route name (USER, T30, etc.). */
  gateway?: string;
  /** Digits prepended to outbound calls. */
  prefix?: string;
  /** Max concurrent calls. `null` for system routes. */
  limit?: number | null;
  /** `true` for built-in system route types. */
  system?: boolean;
}

/** One number bound to a gateway, returned by `GET /v2.2/gateways/{id}/numbers`. */
export interface GatewayNumberSummary {
  number: PhoneNumber;
  /** Destination after translation rewrite — usually equals `number`. */
  translated: PhoneNumber;
  forward: boolean;
  /** Forwarding destination when `forward` is true. */
  forwardTo: string | null;
  cnam: boolean;
  /** Outbound messaging carrier id; 0 = none. */
  carrier: number;
  smsEnabled: boolean;
  faxEnabled: boolean;
}

/** Response data for `GET /v2.2/gateways`. */
export interface GatewaysListData {
  gateways: GatewayEntry[];
}

/** Response data for `GET /v2.2/gateways/{id}/numbers`. */
export interface GatewayNumbersData {
  numbers: GatewayNumberSummary[];
}
