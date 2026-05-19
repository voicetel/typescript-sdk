/** A support ticket's current status. */
export type TicketStatus = "active" | "pending" | "closed" | "spam";

/** Body for `POST /v2.2/support/tickets`. */
export interface TicketCreateRequest {
  subject: string;
  message: string;
  /** Admin only: create the ticket on behalf of this customer email. */
  email?: string;
}

/** Body for `PUT /v2.2/support/tickets/{id}`. */
export interface TicketUpdateRequest {
  status: TicketStatus;
}

/** Body for `POST /v2.2/support/tickets/{id}/replies`. */
export interface TicketReplyRequest {
  message: string;
}

// --- shared sub-types -----------------------------------------------------

/** Provenance of a ticket or thread. */
export interface TicketSource {
  via?: string;
  type?: string;
}

/** Action descriptor on a thread. */
export interface TicketAction {
  text?: string;
  type?: string;
}

/** `createdBy` / `assignee` / `assignedTo` / `closedByUser` shape. */
export interface TicketActor {
  id?: number;
  /** "customer" or "user". */
  type?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

/** One custom-field row on a conversation. */
export interface CustomFieldValue {
  id?: number;
  value?: string;
  text?: string;
}

/** A `{ id, value, type }` entry under `embedded.{emails|phones|socialProfiles}`. */
export interface CustomerContactEntry {
  id?: number;
  value?: string;
  type?: string;
}

/** A `{ id, value }` entry under `embedded.websites`. */
export interface CustomerWebsiteEntry {
  id?: number;
  value?: string;
}

/** `embedded.address` shape on a {@link SupportCustomer}. */
export interface CustomerAddress {
  street?: string;
  city?: string;
  /** Two-letter US state code. */
  state?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  zip?: string;
}

/** `embedded` shape on a {@link SupportCustomer}. */
export interface CustomerEmbedded {
  address?: CustomerAddress;
  emails?: CustomerContactEntry[];
  phones?: CustomerContactEntry[];
  socialProfiles?: CustomerContactEntry[];
  websites?: CustomerWebsiteEntry[];
}

/** One file attached to a support thread. */
export interface SupportAttachment {
  id?: number;
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  /** Bytes. */
  size?: number;
}

/** `embedded` shape on a {@link SupportThread}. */
export interface ThreadEmbedded {
  attachments?: SupportAttachment[];
}

/** End-user profile attached to a support ticket. */
export interface SupportCustomer {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Free-form, max 60 chars. */
  company?: string;
  jobTitle?: string;
  photoType?: string;
  photoUrl?: string;
  notes?: string;
  /** Always "customer". */
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  embedded?: CustomerEmbedded;
}

/** One thread (message) within a ticket conversation. */
export interface SupportThread {
  id?: number;
  status: TicketStatus;
  state?: string;
  /** "customer" = from the user; "message" = staff reply; "note" = internal note. */
  type?: "customer" | "message" | "note";
  body?: string;
  rating?: number;
  ratingComment?: string;
  openedAt?: string;
  createdAt?: string;
  source?: TicketSource;
  action?: TicketAction;
  createdBy?: TicketActor;
  assignedTo?: TicketActor;
  customer?: SupportCustomer;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  embedded?: ThreadEmbedded;
}

/** `embedded` shape on a {@link SupportConversation}. */
export interface ConversationEmbedded {
  threads?: SupportThread[];
}

/**
 * A support ticket.
 *
 * Note: the wire field `number` is a ticket *sequence number* (#1015), NOT a
 * phone number. We expose it as `ticketNumber` to avoid confusion with
 * 10-digit TNs everywhere else in this API.
 */
export interface SupportConversation {
  id?: number;
  /** Human-readable ticket sequence shown to the customer (e.g. 1015). */
  ticketNumber?: number;
  status: TicketStatus;
  state?: string;
  subject?: string;
  preview?: string;
  type?: string;
  mailboxId?: number;
  folderId?: number;
  threadsCount?: number;
  closedBy?: number;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  userUpdatedAt?: string;
  customerWaitingSince?: Record<string, unknown>;
  source?: TicketSource;
  createdBy?: TicketActor;
  assignee?: TicketActor;
  closedByUser?: TicketActor;
  customer?: SupportCustomer;
  cc?: string[];
  bcc?: string[];
  customFields?: CustomFieldValue[];
  embedded?: ConversationEmbedded;
}

/** Response data for `GET`/`POST /v2.2/support/tickets/...`. */
export interface TicketData {
  ticket: SupportConversation;
}

/** Response data for `GET /v2.2/support/tickets`. */
export interface TicketsListData {
  tickets: SupportConversation[];
}

/** Response data for `GET /v2.2/support/tickets/{id}/messages`. */
export interface TicketThreadsData {
  messages: SupportThread[];
}

/** Response data for `POST /v2.2/support/tickets/{id}/replies`. */
export interface TicketReplyData {
  /** Always "Reply added". */
  message: "Reply added";
}

/** Response data for `PUT /v2.2/support/tickets/{id}`. */
export interface TicketUpdateData {
  id?: number;
  /** Outcome, e.g. "success". */
  status: string;
}
