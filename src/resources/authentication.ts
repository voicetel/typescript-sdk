import type { Transport } from "../transport.js";
import type { AuthGetData, AuthPutData, AuthPutRequest } from "../models/authentication.js";

/** SIP/HTTP authentication settings (mode + password). */
export class AuthenticationService {
  constructor(private readonly t: Transport) {}

  get(opts?: { signal?: AbortSignal }): Promise<AuthGetData> {
    return this.t.request<AuthGetData>({ method: "GET", path: "/v2.2/auth", ...opts });
  }

  update(body: AuthPutRequest, opts?: { signal?: AbortSignal }): Promise<AuthPutData> {
    return this.t.request<AuthPutData>({ method: "PUT", path: "/v2.2/auth", body, ...opts });
  }
}
