import type { Transport } from "../transport.js";
import type {
  FaxHistoryData,
  FaxHistoryStatus,
  FaxJob,
  FaxNumbersData,
  FaxSendData,
  FaxSendRequest,
} from "../models/fax.js";

/** Fax sending and history. */
export class FaxService {
  constructor(private readonly t: Transport) {}

  /**
   * List every number on the account that can send and receive faxes, with the
   * email address each delivers to (the per-number fax destination, or the
   * account email when `destinationId` is 0).
   */
  numbers(opts?: { signal?: AbortSignal }): Promise<FaxNumbersData> {
    return this.t.request<FaxNumbersData>({ method: "GET", path: "/v2.2/numbers/fax", ...opts });
  }

  /**
   * Send a fax — `POST /v2.2/faxes` as a multipart form (`fromNumber`,
   * `toNumber`, and 1–10 documents). Documents are PDF/DOC/DOCX, checked by
   * content; 8 MiB each and 8 MiB total.
   *
   * The `Idempotency-Key` header is a client-generated UUID (taken from
   * `idempotencyKey`, or generated when omitted): resubmitting the same
   * documents with the same key returns the original job instead of sending
   * twice. Requires an enabled account with a positive balance; limited to 10
   * sends per minute per account.
   */
  send(body: FaxSendRequest, opts?: { signal?: AbortSignal }): Promise<FaxSendData> {
    const form = new FormData();
    form.set("fromNumber", body.fromNumber);
    form.set("toNumber", body.toNumber);
    for (const doc of body.documents) {
      form.append(
        "documents",
        new Blob([doc.data], { type: doc.contentType ?? "application/pdf" }),
        doc.name,
      );
    }
    return this.t.request<FaxSendData>({
      method: "POST",
      path: "/v2.2/faxes",
      formData: form,
      headers: { "Idempotency-Key": body.idempotencyKey ?? globalThis.crypto.randomUUID() },
      ...opts,
    });
  }

  /**
   * Fax history for one of your fax numbers, newest first, with cursor paging.
   * `from` / `to` are unix seconds — `from` is the newer edge (defaults to
   * now), `to` the older edge (defaults to 24 hours ago). `limit` is 1–100
   * (default 50); `status` filters by job state (`active` = not yet finished).
   */
  history(args: {
    /** A fax number on the account whose history to read. */
    number: string;
    /** Newer edge of the range, unix seconds. Defaults to now. */
    from?: number;
    /** Older edge of the range, unix seconds. Defaults to 24 hours ago. */
    to?: number;
    /** Page size, 1 to 100. Defaults to 50. */
    limit?: number;
    /** Paging cursor from a previous response's `nextCursor`. */
    cursor?: string;
    /** Filter by job state; `active` means not yet finished. */
    status?: FaxHistoryStatus;
    signal?: AbortSignal;
  }): Promise<FaxHistoryData> {
    const opts: { signal?: AbortSignal } = {};
    if (args.signal) opts.signal = args.signal;
    return this.t.request<FaxHistoryData>({
      method: "GET",
      path: "/v2.2/faxes",
      query: {
        number: args.number,
        from: args.from,
        to: args.to,
        limit: args.limit,
        cursor: args.cursor,
        status: args.status,
      },
      ...opts,
    });
  }

  /** Read one fax job by id — poll until `status` is `sent` or `failed`. */
  get(id: string, opts?: { signal?: AbortSignal }): Promise<FaxJob> {
    return this.t.request<FaxJob>({
      method: "GET",
      path: `/v2.2/faxes/${encodeURIComponent(id)}`,
      ...opts,
    });
  }

  /**
   * Download the PDF rendering of the fax — `GET /v2.2/faxes/{id}/document` —
   * as raw bytes (a `Uint8Array`). Available when the job reports
   * `documentAvailable: true`; throws `not_found` when no document was kept.
   */
  document(id: string, opts?: { signal?: AbortSignal }): Promise<Uint8Array> {
    return this.t.request<Uint8Array>({
      method: "GET",
      path: `/v2.2/faxes/${encodeURIComponent(id)}/document`,
      responseKind: "bytes",
      ...opts,
    });
  }
}
