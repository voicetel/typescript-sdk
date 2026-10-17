import type { Transport } from "../transport.js";
import type {
  AccountAddData,
  AccountAddRequest,
  AccountCdrData,
  AccountCreditsData,
  AccountData,
  AccountMrcData,
  AccountPaymentsData,
  AccountPutData,
  AccountPutRequest,
  AccountRecoverData,
  AccountRecoverRequest,
  AccountRegistrationData,
  AccountSignupData,
  AccountSignupRequest,
} from "../models/account.js";

/**
 * Operations under the `Account` tag.
 *
 * Note: `get`, `cdr`, `recurringCharges` and `client.login()` share a
 * 6 req/hour/IP rate limit. Bursting will trigger 429s.
 */
export class AccountService {
  constructor(private readonly t: Transport) {}

  /** Rate-limited (6/hr/IP). */
  get(opts?: { signal?: AbortSignal }): Promise<AccountData> {
    return this.t.request<AccountData>({ method: "GET", path: "/v2.2/account", ...opts });
  }

  update(body: AccountPutRequest, opts?: { signal?: AbortSignal }): Promise<AccountPutData> {
    return this.t.request<AccountPutData>({ method: "PUT", path: "/v2.2/account", body, ...opts });
  }

  add(body: AccountAddRequest, opts?: { signal?: AbortSignal }): Promise<AccountAddData> {
    return this.t.request<AccountAddData>({ method: "POST", path: "/v2.2/account", body, ...opts });
  }

  /** Public sign-up flow — no auth required. */
  signup(body: AccountSignupRequest, opts?: { signal?: AbortSignal }): Promise<AccountSignupData> {
    return this.t.request<AccountSignupData>({
      method: "POST",
      path: "/v2.2/accounts",
      body,
      requireAuth: false,
      ...opts,
    });
  }

  /** Call detail records. Rate-limited (6/hr/IP). */
  cdr(
    args: { start?: number; end?: number; signal?: AbortSignal } = {},
  ): Promise<AccountCdrData> {
    return this.t.request<AccountCdrData>({
      method: "GET",
      path: "/v2.2/account/cdr",
      query: { start: args.start, end: args.end },
      ...(args.signal && { signal: args.signal }),
    });
  }

  credits(
    args: { status?: "paid" | "unpaid"; signal?: AbortSignal } = {},
  ): Promise<AccountCreditsData> {
    return this.t.request<AccountCreditsData>({
      method: "GET",
      path: "/v2.2/account/credits",
      query: { status: args.status },
      ...(args.signal && { signal: args.signal }),
    });
  }

  /** Rate-limited (6/hr/IP). */
  recurringCharges(opts?: { signal?: AbortSignal }): Promise<AccountMrcData> {
    return this.t.request<AccountMrcData>({
      method: "GET",
      path: "/v2.2/account/recurring-charges",
      ...opts,
    });
  }

  payments(opts?: { signal?: AbortSignal }): Promise<AccountPaymentsData> {
    return this.t.request<AccountPaymentsData>({
      method: "GET",
      path: "/v2.2/account/payments",
      ...opts,
    });
  }

  registration(opts?: { signal?: AbortSignal }): Promise<AccountRegistrationData> {
    return this.t.request<AccountRegistrationData>({
      method: "GET",
      path: "/v2.2/account/registration",
      ...opts,
    });
  }

  /** No auth required. */
  recover(
    body: AccountRecoverRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<AccountRecoverData> {
    return this.t.request<AccountRecoverData>({
      method: "POST",
      path: "/v2.2/account/recovery",
      body,
      requireAuth: false,
      ...opts,
    });
  }
}
