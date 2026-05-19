import type { Transport } from "../transport.js";
import type {
  NumberAddData,
  NumberAddRequest,
  NumberCampaignAssignRequest,
  NumberCnamData,
  NumberCnamRequest,
  NumberDetail,
  NumberFaxData,
  NumberFaxRequest,
  NumberForwardData,
  NumberForwardRequest,
  NumberLidbData,
  NumberLidbRequest,
  NumberMessagingCampaignAssignData,
  NumberMessagingCampaignUnassignData,
  NumberMessagingPatchData,
  NumberMessagingPatchRequest,
  NumberMessagingState,
  NumberMoveData,
  NumberMoveRequest,
  NumberRouteData,
  NumberRouteRequest,
  NumberSmsData,
  NumberSmsRequest,
  NumberTranslationData,
  NumberTranslationRequest,
  NumbersListData,
  NumbersMessagingCampaignUnassignData,
  PortOutPinUpdateData,
  PortOutPinUpdateRequest,
} from "../models/numbers.js";

/** Every operation on a TN owned by the account. */
export class NumbersService {
  constructor(private readonly t: Transport) {}

  list(opts?: { signal?: AbortSignal }): Promise<NumbersListData> {
    return this.t.request<NumbersListData>({ method: "GET", path: "/v2.2/numbers", ...opts });
  }

  add(body: NumberAddRequest, opts?: { signal?: AbortSignal }): Promise<NumberAddData> {
    return this.t.request<NumberAddData>({ method: "POST", path: "/v2.2/numbers", body, ...opts });
  }

  get(number: string, opts?: { signal?: AbortSignal }): Promise<NumberDetail> {
    return this.t.request<NumberDetail>({ method: "GET", path: `/v2.2/numbers/${number}`, ...opts });
  }

  /** Returns nothing on 204 No Content. */
  remove(number: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({ method: "DELETE", path: `/v2.2/numbers/${number}`, ...opts });
  }

  move(
    number: string,
    body: NumberMoveRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberMoveData> {
    return this.t.request<NumberMoveData>({
      method: "PATCH",
      path: `/v2.2/numbers/${number}`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  release(number: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({
      method: "POST",
      path: `/v2.2/numbers/${number}/release`,
      ...opts,
    });
  }

  setRoute(
    number: string,
    body: NumberRouteRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberRouteData> {
    return this.t.request<NumberRouteData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/route`,
      body,
      ...opts,
    });
  }

  setTranslation(
    number: string,
    body: NumberTranslationRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberTranslationData> {
    return this.t.request<NumberTranslationData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/translation`,
      body,
      ...opts,
    });
  }

  setCnam(
    number: string,
    body: NumberCnamRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberCnamData> {
    return this.t.request<NumberCnamData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/cnam`,
      body,
      ...opts,
    });
  }

  setLidb(
    number: string,
    body: NumberLidbRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberLidbData> {
    return this.t.request<NumberLidbData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/lidb`,
      body,
      ...opts,
    });
  }

  getFax(number: string, opts?: { signal?: AbortSignal }): Promise<NumberFaxData> {
    return this.t.request<NumberFaxData>({
      method: "GET",
      path: `/v2.2/numbers/${number}/fax`,
      ...opts,
    });
  }

  setFax(
    number: string,
    body: NumberFaxRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberFaxData> {
    return this.t.request<NumberFaxData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/fax`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  removeFax(number: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({
      method: "DELETE",
      path: `/v2.2/numbers/${number}/fax`,
      ...opts,
    });
  }

  setForward(
    number: string,
    body: NumberForwardRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberForwardData> {
    return this.t.request<NumberForwardData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/forward`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  removeForward(number: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({
      method: "DELETE",
      path: `/v2.2/numbers/${number}/forward`,
      ...opts,
    });
  }

  getSms(number: string, opts?: { signal?: AbortSignal }): Promise<NumberSmsData> {
    return this.t.request<NumberSmsData>({
      method: "GET",
      path: `/v2.2/numbers/${number}/sms`,
      ...opts,
    });
  }

  setSms(
    number: string,
    body: NumberSmsRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberSmsData> {
    return this.t.request<NumberSmsData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/sms`,
      body,
      ...opts,
    });
  }

  /** Returns nothing on 204 No Content. */
  removeSms(number: string, opts?: { signal?: AbortSignal }): Promise<void> {
    return this.t.request<void>({
      method: "DELETE",
      path: `/v2.2/numbers/${number}/sms`,
      ...opts,
    });
  }

  getMessaging(number: string, opts?: { signal?: AbortSignal }): Promise<NumberMessagingState> {
    return this.t.request<NumberMessagingState>({
      method: "GET",
      path: `/v2.2/numbers/${number}/messaging`,
      ...opts,
    });
  }

  patchMessaging(
    number: string,
    body: NumberMessagingPatchRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberMessagingPatchData> {
    return this.t.request<NumberMessagingPatchData>({
      method: "PATCH",
      path: `/v2.2/numbers/${number}/messaging`,
      body,
      ...opts,
    });
  }

  assignCampaign(
    number: string,
    body: NumberCampaignAssignRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberMessagingCampaignAssignData> {
    return this.t.request<NumberMessagingCampaignAssignData>({
      method: "PUT",
      path: `/v2.2/numbers/${number}/messaging-campaign`,
      body,
      ...opts,
    });
  }

  unassignCampaign(
    number: string,
    opts?: { signal?: AbortSignal },
  ): Promise<NumberMessagingCampaignUnassignData> {
    return this.t.request<NumberMessagingCampaignUnassignData>({
      method: "DELETE",
      path: `/v2.2/numbers/${number}/messaging-campaign`,
      ...opts,
    });
  }

  bulkUnassignCampaign(
    numbers: string[],
    opts?: { signal?: AbortSignal },
  ): Promise<NumbersMessagingCampaignUnassignData> {
    return this.t.request<NumbersMessagingCampaignUnassignData>({
      method: "DELETE",
      path: "/v2.2/numbers/messaging-campaign",
      body: { numbers },
      ...opts,
    });
  }

  setPortOutPin(
    number: string,
    body: PortOutPinUpdateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<PortOutPinUpdateData> {
    return this.t.request<PortOutPinUpdateData>({
      method: "PATCH",
      path: `/v2.2/numbers/${number}/port-out-pin`,
      body,
      ...opts,
    });
  }
}
