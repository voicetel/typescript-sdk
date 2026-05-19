import type { Transport } from "../transport.js";
import type {
  TicketCreateRequest,
  TicketData,
  TicketReplyData,
  TicketReplyRequest,
  TicketThreadsData,
  TicketUpdateData,
  TicketUpdateRequest,
  TicketsListData,
} from "../models/support.js";

/** Support tickets — create, read, update, delete, reply. */
export class SupportService {
  constructor(private readonly t: Transport) {}

  list(opts?: { signal?: AbortSignal }): Promise<TicketsListData> {
    return this.t.request<TicketsListData>({
      method: "GET",
      path: "/v2.2/support/tickets",
      ...opts,
    });
  }

  create(body: TicketCreateRequest, opts?: { signal?: AbortSignal }): Promise<TicketData> {
    return this.t.request<TicketData>({
      method: "POST",
      path: "/v2.2/support/tickets",
      body,
      ...opts,
    });
  }

  get(id: number, opts?: { signal?: AbortSignal }): Promise<TicketData> {
    return this.t.request<TicketData>({
      method: "GET",
      path: `/v2.2/support/tickets/${id}`,
      ...opts,
    });
  }

  update(
    id: number,
    body: TicketUpdateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<TicketUpdateData> {
    return this.t.request<TicketUpdateData>({
      method: "PUT",
      path: `/v2.2/support/tickets/${id}`,
      body,
      ...opts,
    });
  }

  /** Admin only. Returns nothing on 204 No Content. */
  delete(id: number, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({
      method: "DELETE",
      path: `/v2.2/support/tickets/${id}`,
      ...opts,
    });
  }

  messages(id: number, opts?: { signal?: AbortSignal }): Promise<TicketThreadsData> {
    return this.t.request<TicketThreadsData>({
      method: "GET",
      path: `/v2.2/support/tickets/${id}/messages`,
      ...opts,
    });
  }

  reply(
    id: number,
    body: TicketReplyRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<TicketReplyData> {
    return this.t.request<TicketReplyData>({
      method: "POST",
      path: `/v2.2/support/tickets/${id}/replies`,
      body,
      ...opts,
    });
  }
}
