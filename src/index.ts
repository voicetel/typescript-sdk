/**
 * Official TypeScript / JavaScript SDK for the VoiceTel REST API.
 *
 * See https://voicetel.com/docs/api/v2.2/ for the full API reference,
 * https://voicetel.com/docs/api/v2.2/playground/ for an interactive playground,
 * and https://voicetel.com/docs/api/v2.2/credentials/ to obtain credentials.
 *
 * ```ts
 * import { VoiceTelClient } from "@voicetel/sdk";
 *
 * const client = new VoiceTelClient();
 * await client.login(1000000001, "hunter2");
 * const me = await client.account.get();
 * ```
 */

export { VoiceTelClient } from "./client.js";
export { ApiError, isAuthentication, isConflict, isNotFound, isRateLimit } from "./errors.js";
export type { ErrorKind, ApiErrorOptions } from "./errors.js";
export type { ClientOptions } from "./transport.js";
export { API_VERSION, DEFAULT_BASE_URL, SDK_VERSION } from "./version.js";
export type { InventoryQuery, CoverageQuery } from "./resources/inumbering.js";

export * from "./models/index.js";
