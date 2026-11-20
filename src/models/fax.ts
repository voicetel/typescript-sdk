/** Lifecycle state of a fax job. */
export type FaxJobStatus = "queued" | "sending" | "retry_pending" | "sent" | "failed";

/** Status filter accepted by the fax history listing; `active` means not yet finished. */
export type FaxHistoryStatus =
  | "all"
  | "active"
  | "queued"
  | "sending"
  | "retry_pending"
  | "sent"
  | "failed";

/** Metadata of one document attached to a fax. */
export interface FaxDocumentMeta {
  /** File name. */
  name: string;
  /** Document size in bytes. */
  size: number;
  /** Media type (e.g. `application/pdf`). */
  contentType: string;
}

/**
 * One document to send, attached to the multipart form.
 *
 * PDF, DOC or DOCX — the server checks the file's magic bytes, not its
 * extension. At most 8 MiB per document and 8 MiB total.
 */
export interface FaxDocumentFile {
  /** File name (e.g. `"contract.pdf"`). */
  name: string;
  /** Document contents — raw bytes (`Uint8Array` / `ArrayBuffer`), a `Blob`, or a string. */
  data: BlobPart;
  /** Media type; defaults to `application/pdf`. */
  contentType?: string;
}

/** Body for `client.fax.send(...)` — `POST /v2.2/faxes` as multipart/form-data. */
export interface FaxSendRequest {
  /** Fax number on the account to send from, ten digits. */
  fromNumber: string;
  /** Destination US or Canadian fax number, ten digits. */
  toNumber: string;
  /** One to ten documents (PDF/DOC/DOCX, 8 MiB each and in total). */
  documents: FaxDocumentFile[];
  /**
   * Client-generated UUID sent as the `Idempotency-Key` header. Resubmitting
   * the same documents with the same key returns the original job instead of
   * sending twice. Generated with `crypto.randomUUID()` when omitted.
   */
  idempotencyKey?: string;
}

/** Response data for `GET /v2.2/numbers/fax` — the fax-capable numbers. */
export interface FaxNumbersData {
  /** Fax-capable numbers on the account, ascending. */
  numbers: FaxNumberEntry[];
}

/** One fax-capable number on the account. */
export interface FaxNumberEntry {
  /** The fax number, ten digits. */
  number: string;
  /** Per-number fax destination row id, or 0 when it delivers to the account email. */
  destinationId: number;
  /** Email address faxes to this number deliver to. */
  email: string;
}

/** Response data for `POST /v2.2/faxes` — the accepted job. */
export interface FaxSendData {
  /** Identifier of the accepted fax job. */
  id: string;
  fromNumber: string;
  toNumber: string;
  /** Job state at acceptance: `queued`. */
  status: "queued";
  /** The accepted documents. */
  documents: FaxDocumentMeta[];
}

/** One fax job: routing, lifecycle timestamps and documents. */
export interface FaxJob {
  id: string;
  fromNumber: string;
  toNumber: string;
  /** The `Idempotency-Key` the fax was submitted with, or null. */
  clientToken: string | null;
  status: FaxJobStatus;
  /** Acceptance time, ISO-8601 UTC. */
  submittedAt: string;
  /** When delivery was first attempted, ISO-8601 UTC, or null. */
  startedAt: string | null;
  /** When the job reached `sent` or `failed`, ISO-8601 UTC, or null while active. */
  completedAt: string | null;
  /** Delivery attempts so far, or null while queued. */
  attempts: number | null;
  /** Why the fax failed, on failed jobs; null otherwise. */
  failureReason: string | null;
  /** The submitted documents. */
  documents: FaxDocumentMeta[];
  /** Whether `client.fax.document(id)` can serve the PDF. */
  documentAvailable: boolean;
  /** File name the document downloads as. */
  documentName?: string;
  /** Total document size in bytes, or null when there are no documents. */
  documentSize: number | null;
}

/** Response data for `GET /v2.2/faxes` — one page of history for a number. */
export interface FaxHistoryData {
  /** The number the history belongs to, ten digits. */
  number: string;
  /** Newer edge of the returned range, unix seconds. */
  fromTs: number;
  /** Older edge of the returned range, unix seconds. */
  toTs: number;
  /** Fax jobs, newest first. */
  faxes: FaxJob[];
  /** Cursor for the next page, or null when the page is the last. */
  nextCursor: string | null;
}
