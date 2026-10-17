import type { Transport } from "../transport.js";
import type {
  MessageHistoryData,
  MessageSendData,
  MessageSendRequest,
  MessagingBrandCreateData,
  MessagingBrandCreateRequest,
  MessagingCampaignCreateData,
  MessagingCampaignCreateRequest,
  MessagingCampaignStatusData,
} from "../models/messaging.js";
import type { NumbersMessagingListData } from "../models/numbers.js";

/** SMS / MMS sending and 10DLC brand/campaign registration. */
export class MessagingService {
  constructor(private readonly t: Transport) {}

  /**
   * Fetch message history for one number. `from` / `to` are Unix timestamps —
   * `from` is the newer end of the range (defaults to now), `to` the older end
   * (defaults to 24h ago).
   */
  history(args: {
    /** 10-digit telephone number on the authenticated account. */
    number: string;
    /** Unix timestamp range start (newer). Defaults to now. */
    from?: number;
    /** Unix timestamp range end (older). Defaults to 24h ago. */
    to?: number;
    /** `sms` (default), `mms`, or `dlr` (delivery status events). */
    type?: "sms" | "mms" | "dlr";
    signal?: AbortSignal;
  }): Promise<MessageHistoryData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<MessageHistoryData>({
      method: "GET",
      path: "/v2.2/messages",
      query: {
        number: args.number,
        from: args.from,
        to: args.to,
        type: args.type,
      },
      ...opts,
    });
  }

  /** Send an SMS or MMS. */
  send(body: MessageSendRequest, opts?: { signal?: AbortSignal }): Promise<MessageSendData> {
    return this.t.request<MessageSendData>({
      method: "POST",
      path: "/v2.2/messages",
      body,
      ...opts,
    });
  }

  /** Register a 10DLC brand with the campaign registry. */
  createBrand(
    body: MessagingBrandCreateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<MessagingBrandCreateData> {
    return this.t.request<MessagingBrandCreateData>({
      method: "POST",
      path: "/v2.2/messaging/brands",
      body,
      ...opts,
    });
  }

  /** Current 10DLC campaign statuses. `ids` are the alphanumeric campaign ids to query (max 100). */
  campaignStatus(
    ids: string[],
    opts?: { signal?: AbortSignal },
  ): Promise<MessagingCampaignStatusData> {
    return this.t.request<MessagingCampaignStatusData>({
      method: "GET",
      path: "/v2.2/messaging/campaigns",
      query: { ids: ids.join(",") },
      ...opts,
    });
  }

  /** Register a 10DLC campaign with the carrier. */
  createCampaign(
    body: MessagingCampaignCreateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<MessagingCampaignCreateData> {
    return this.t.request<MessagingCampaignCreateData>({
      method: "POST",
      path: "/v2.2/messaging/campaigns",
      body,
      ...opts,
    });
  }

  /** Read messaging state for many numbers at once (max 1000). */
  numbersState(numbers: string[], opts?: { signal?: AbortSignal }): Promise<NumbersMessagingListData> {
    return this.t.request<NumbersMessagingListData>({
      method: "GET",
      path: "/v2.2/numbers/messaging",
      query: { numbers: numbers.join(",") },
      ...opts,
    });
  }

  /**
   * Account-wide messaging health overview — the same view as the portal Messaging
   * tab: summary counts (numbers, messaging on, healthy, needing attention, in
   * progress), campaigns with carrier-review progress, numbers needing attention
   * (each with a plain-language title, detail and fix-it actions), 14 days of
   * delivery counts, and the alert-email setting. Updated hourly.
   *
   * The API spec defines no response schema for this endpoint, so the decoded JSON
   * object is returned as-is.
   */
  health(opts?: { signal?: AbortSignal }): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: "GET",
      path: "/v2.2/messaging/health",
      ...opts,
    });
  }

  /**
   * The alert-email setting: whether new messaging problems are emailed to the
   * account. The spec defines no response schema, so the decoded JSON object is
   * returned as-is.
   */
  healthAlerts(opts?: { signal?: AbortSignal }): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: "GET",
      path: "/v2.2/messaging/health/alerts",
      ...opts,
    });
  }

  /**
   * Turn alert emails on or off. When enabled, the account is emailed as new
   * messaging problems are found (at most one digest about every 20 hours). The
   * spec defines no response schema, so the decoded JSON object is returned as-is.
   */
  setHealthAlerts(
    enabled: boolean,
    opts?: { signal?: AbortSignal },
  ): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: "PUT",
      path: "/v2.2/messaging/health/alerts",
      body: { enabled },
      ...opts,
    });
  }

  /**
   * Live health check of one number: in service, messaging enabled, campaign
   * approved, assigned to the campaign by the messaging provider, delivery failures
   * in the last 24 hours, and enablement in progress. Limited to 30 checks per hour
   * per account. The spec defines no response schema, so the decoded JSON object is
   * returned as-is.
   */
  healthCheck(number: string, opts?: { signal?: AbortSignal }): Promise<Record<string, unknown>> {
    return this.t.request<Record<string, unknown>>({
      method: "POST",
      path: "/v2.2/messaging/health/check",
      body: { number },
      ...opts,
    });
  }

  /**
   * Up to 3 recent outbound messages from the number that carriers blocked as spam
   * (time, masked recipient, text, reason), to help review content. The spec defines
   * no response schema for the individual samples, so the decoded JSON array is
   * returned as-is.
   */
  healthSamples(
    number: string,
    opts?: { signal?: AbortSignal },
  ): Promise<Record<string, unknown>[]> {
    return this.t.request<Record<string, unknown>[]>({
      method: "GET",
      path: "/v2.2/messaging/health/samples",
      query: { number },
      ...opts,
    });
  }
}
