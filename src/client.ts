import { ApiError } from "./errors.js";
import type { AccountApiKeyData } from "./models/account.js";
import { AccountService } from "./resources/account.js";
import { AclService } from "./resources/acl.js";
import { AuthenticationService } from "./resources/authentication.js";
import { E911Service } from "./resources/e911.js";
import { GatewaysService } from "./resources/gateways.js";
import { INumberingService } from "./resources/inumbering.js";
import { LookupsService } from "./resources/lookups.js";
import { MessagingService } from "./resources/messaging.js";
import { NumbersService } from "./resources/numbers.js";
import { SupportService } from "./resources/support.js";
import { Transport, type ClientOptions } from "./transport.js";

/**
 * Entry point for the VoiceTel API.
 *
 * Construct with `new VoiceTelClient({ apiKey: "..." })` (or call
 * {@link VoiceTelClient.login} to exchange username + password for a bearer)
 * and reach the API through the typed resource fields — for example
 * `client.numbers.list()`.
 */
export class VoiceTelClient {
  /** @internal */
  readonly transport: Transport;

  readonly account: AccountService;
  readonly acl: AclService;
  readonly authentication: AuthenticationService;
  readonly e911: E911Service;
  readonly gateways: GatewaysService;
  readonly iNumbering: INumberingService;
  readonly lookups: LookupsService;
  readonly messaging: MessagingService;
  readonly numbers: NumbersService;
  readonly support: SupportService;

  constructor(options: ClientOptions = {}) {
    this.transport = new Transport(options);
    this.account = new AccountService(this.transport);
    this.acl = new AclService(this.transport);
    this.authentication = new AuthenticationService(this.transport);
    this.e911 = new E911Service(this.transport);
    this.gateways = new GatewaysService(this.transport);
    this.iNumbering = new INumberingService(this.transport);
    this.lookups = new LookupsService(this.transport);
    this.messaging = new MessagingService(this.transport);
    this.numbers = new NumbersService(this.transport);
    this.support = new SupportService(this.transport);
  }

  /** Currently installed bearer token (empty string before {@link login}). */
  get apiKey(): string {
    return this.transport.getApiKey();
  }

  /** API base URL this client is configured against. */
  get baseUrl(): string {
    return this.transport.getBaseUrl();
  }

  /**
   * Exchange username + password for a 32-hex API key and install it on this
   * client.
   *
   * The exchange counts against the 6 req/hour/IP rate limit shared by every
   * `account/*` endpoint (cdr, mrc, payments, registration, api-key).
   */
  async login(
    username: number,
    password: string,
    opts?: { signal?: AbortSignal },
  ): Promise<string> {
    const data = await this.transport.request<AccountApiKeyData>({
      method: "POST",
      path: "/v2.2/account/api-key",
      body: { username, password },
      requireAuth: false,
      ...opts,
    });
    if (!data.apikey) {
      throw new ApiError("api-key response did not contain data.apikey", {
        kind: "authentication",
        body: data,
      });
    }
    this.transport.setBearer(data.apikey);
    return data.apikey;
  }
}
