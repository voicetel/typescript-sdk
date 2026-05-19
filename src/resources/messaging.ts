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

  /** Fetch message history. Filter by number/type and/or `[start, end]` Unix timestamps. */
  history(
    args: {
      number?: string;
      start?: number;
      end?: number;
      type?: "sms" | "mms" | "dlr";
      signal?: AbortSignal;
    } = {},
  ): Promise<MessageHistoryData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<MessageHistoryData>({
      method: "GET",
      path: "/v2.2/messages",
      query: {
        number: args.number,
        start: args.start,
        end: args.end,
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

  /** Current 10DLC campaign statuses on the account. */
  campaignStatus(opts?: { signal?: AbortSignal }): Promise<MessagingCampaignStatusData> {
    return this.t.request<MessagingCampaignStatusData>({
      method: "GET",
      path: "/v2.2/messaging/campaigns",
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

  /** Read messaging state for many numbers at once. Empty `numbers` = all on account. */
  numbersState(
    numbers?: string[],
    opts?: { signal?: AbortSignal },
  ): Promise<NumbersMessagingListData> {
    const query: Record<string, string | undefined> = {};
    if (numbers && numbers.length > 0) query.numbers = numbers.join(",");
    return this.t.request<NumbersMessagingListData>({
      method: "GET",
      path: "/v2.2/numbers/messaging",
      query,
      ...opts,
    });
  }
}
