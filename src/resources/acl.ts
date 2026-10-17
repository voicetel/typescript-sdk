import type { Transport } from "../transport.js";
import type { AclAddData, AclListData, AclModifyRequest, AclRemoveData } from "../models/acl.js";

/** IP-based access control list. */
export class AclService {
  constructor(private readonly t: Transport) {}

  list(opts?: { signal?: AbortSignal }): Promise<AclListData> {
    return this.t.request<AclListData>({ method: "GET", path: "/v2.2/acl", ...opts });
  }

  add(body: AclModifyRequest, opts?: { signal?: AbortSignal }): Promise<AclAddData> {
    return this.t.request<AclAddData>({ method: "POST", path: "/v2.2/acl", body, ...opts });
  }

  /** Remove the given CIDR blocks (sent as a comma-separated `cidrs` query parameter). */
  remove(cidrs: string[], opts?: { signal?: AbortSignal }): Promise<AclRemoveData> {
    return this.t.request<AclRemoveData>({
      method: "DELETE",
      path: "/v2.2/acl",
      query: { cidrs: cidrs.join(",") },
      ...opts,
    });
  }
}
