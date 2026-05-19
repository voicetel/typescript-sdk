import { vi } from "vitest";
import { VoiceTelClient } from "../src/index.js";

/**
 * A captured request — the URL the client tried to fetch, the HTTP method,
 * the parsed JSON body (or undefined), and the headers.
 */
export interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * A scripted response. Use the `ok` / `created` / `noContent` helpers, or
 * build one inline if you need a specific status.
 */
export interface Reply {
  status: number;
  body?: string;
  headers?: Record<string, string>;
}

export const ok = (data: unknown): Reply => ({
  status: 200,
  body: JSON.stringify({ status: "success", data }),
});

export const created = (data: unknown): Reply => ({
  status: 201,
  body: JSON.stringify({ status: "success", data }),
});

export const noContent: Reply = { status: 204 };

export const errorReply = (status: number, code?: string, message?: string): Reply => ({
  status,
  body: JSON.stringify({ code, message: message ?? `HTTP ${status}` }),
});

/**
 * Build a client whose underlying fetch is mocked. The map keys are
 * `METHOD pathname` strings (e.g. `"GET /v2.2/account"`).
 */
export function buildMockClient(
  routes: Record<string, (req: Captured) => Reply>,
  opts: { apiKey?: string; maxRetries?: number } = {},
): { client: VoiceTelClient; captured: Captured[] } {
  const captured: Captured[] = [];
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input.toString());
    const key = `${init?.method ?? "GET"} ${url.pathname}`;
    const headers: Record<string, string> = {};
    if (init?.headers) {
      for (const [k, v] of Object.entries(init.headers)) {
        headers[k] = String(v);
      }
    }
    let body: unknown;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const req: Captured = { url: url.toString(), method: init?.method ?? "GET", headers, body };
    captured.push(req);
    const handler = routes[key];
    if (!handler) {
      throw new Error(`unexpected request: ${key}`);
    }
    const reply = handler(req);
    // Status 204/205 must have a null body per the Fetch spec.
    const replyBody =
      reply.body === undefined || reply.status === 204 || reply.status === 205
        ? null
        : reply.body;
    return new Response(replyBody, { status: reply.status, headers: reply.headers });
  });
  const client = new VoiceTelClient({
    baseUrl: "https://api.voicetel.test",
    apiKey: opts.apiKey ?? "k",
    maxRetries: opts.maxRetries ?? 0,
    fetch: fetchImpl as unknown as typeof globalThis.fetch,
  });
  return { client, captured };
}
