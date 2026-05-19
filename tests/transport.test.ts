import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  API_VERSION,
  DEFAULT_BASE_URL,
  SDK_VERSION,
  VoiceTelClient,
  isAuthentication,
  isConflict,
  isNotFound,
  isRateLimit,
} from "../src/index.js";
import { buildMockClient, errorReply, ok } from "./helpers.js";

describe("client construction", () => {
  it("defaults baseUrl and sets a user-agent", () => {
    const c = new VoiceTelClient();
    expect(c.baseUrl).toBe(DEFAULT_BASE_URL);
    expect(c.apiKey).toBe("");
    expect(SDK_VERSION).toBe("2.2.10");
    expect(API_VERSION).toBe("v2.2.10");
  });

  it("strips trailing slash from baseUrl", () => {
    const c = new VoiceTelClient({ baseUrl: "https://x.test/" });
    expect(c.baseUrl).toBe("https://x.test");
  });

  it("rejects negative maxRetries", () => {
    expect(() => new VoiceTelClient({ maxRetries: -1 })).toThrow(/maxRetries/);
  });

  it("throws when fetch is a non-function value", () => {
    // Passing a truthy non-function bypasses the nullish-fallback to globalThis.fetch.
    expect(
      () => new VoiceTelClient({ fetch: 42 as unknown as typeof globalThis.fetch }),
    ).toThrow(/fetch/);
  });
});

describe("authentication & headers", () => {
  it("sends Bearer + User-Agent on authenticated calls", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/account": () => ok({ username: "1" }),
    });
    await client.account.get();
    expect(captured[0]!.headers["Authorization"]).toBe("Bearer k");
    expect(captured[0]!.headers["User-Agent"]).toMatch(/^voicetel-typescript\//);
    expect(captured[0]!.headers["Accept"]).toBe("application/json");
  });

  it("omits Authorization on unauthenticated endpoints", async () => {
    const { client, captured } = buildMockClient(
      { "POST /v2.2/account/recovery": () => ok({ message: "sent" }) },
      { apiKey: "" },
    );
    await client.account.recover({ email: "x@y.com" });
    expect(captured[0]!.headers["Authorization"]).toBeUndefined();
  });

  it("throws AuthenticationError before fetch when no key is set", async () => {
    const client = new VoiceTelClient({ baseUrl: "http://x", fetch: vi.fn() });
    await expect(client.account.get()).rejects.toBeInstanceOf(ApiError);
    await expect(client.account.get()).rejects.toMatchObject({ kind: "authentication" });
  });
});

describe("error mapping", () => {
  it.each([
    [400, "bad_request"],
    [401, "authentication"],
    [403, "permission_denied"],
    [404, "not_found"],
    [409, "conflict"],
    [429, "rate_limit"],
    [500, "server"],
    [503, "server"],
    [418, "unknown"],
  ])("maps HTTP %d -> kind %s", async (status, kind) => {
    const { client } = buildMockClient({
      "GET /v2.2/account": () => errorReply(status, "X", "boom"),
    });
    await expect(client.account.get()).rejects.toMatchObject({ statusCode: status, kind });
  });

  it("falls back to text body when the response isn't JSON", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/account": () => ({ status: 500, body: "plain text" }),
    });
    try {
      await client.account.get();
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).body).toBe("plain text");
    }
  });
});

describe("retry behaviour", () => {
  it("retries 429 then succeeds", async () => {
    let calls = 0;
    const { client } = buildMockClient(
      {
        "GET /v2.2/account": () => {
          calls += 1;
          if (calls === 1) return { status: 429, headers: { "Retry-After": "0" } };
          return ok({ username: "1" });
        },
      },
      { maxRetries: 2 },
    );
    const me = await client.account.get();
    expect(me.username).toBe("1");
    expect(calls).toBe(2);
  });

  it("returns RateLimit when retries are exhausted", async () => {
    const { client } = buildMockClient(
      { "GET /v2.2/account": () => ({ status: 429, headers: { "Retry-After": "0" } }) },
      { maxRetries: 1 },
    );
    await expect(client.account.get()).rejects.toMatchObject({ kind: "rate_limit" });
  });

  it("retries 503 then succeeds", async () => {
    let calls = 0;
    const { client } = buildMockClient(
      {
        "GET /v2.2/account": () => {
          calls += 1;
          if (calls === 1) return { status: 503 };
          return ok({});
        },
      },
      { maxRetries: 1 },
    );
    await client.account.get();
    expect(calls).toBe(2);
  });
});

describe("login flow", () => {
  it("exchanges credentials, installs the bearer, then authenticates subsequent calls", async () => {
    const { client, captured } = buildMockClient(
      {
        "POST /v2.2/account/api-key": (req) => {
          expect(req.headers["Authorization"]).toBeUndefined();
          expect(req.body).toEqual({ username: 1000000001, password: "pw" });
          return ok({ apikey: "32hex" });
        },
        "GET /v2.2/account": (req) => {
          expect(req.headers["Authorization"]).toBe("Bearer 32hex");
          return ok({ username: "1000000001" });
        },
      },
      { apiKey: "" },
    );
    const key = await client.login(1000000001, "pw");
    expect(key).toBe("32hex");
    expect(client.apiKey).toBe("32hex");
    await client.account.get();
    expect(captured).toHaveLength(2);
  });

  it("throws when the api-key response lacks the apikey field", async () => {
    const { client } = buildMockClient(
      { "POST /v2.2/account/api-key": () => ok({}) },
      { apiKey: "" },
    );
    await expect(client.login(1, "p")).rejects.toMatchObject({ kind: "authentication" });
  });
});

describe("type guards", () => {
  it.each([
    [isRateLimit, "rate_limit", true],
    [isRateLimit, "not_found", false],
    [isNotFound, "not_found", true],
    [isAuthentication, "authentication", true],
    [isConflict, "conflict", true],
  ] as const)("%o -> %s", (guard, kind, expected) => {
    expect(guard(new ApiError("x", { kind }))).toBe(expected);
  });

  it("returns false for non-ApiError values", () => {
    expect(isRateLimit(new Error("io"))).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });
});

describe("envelope unwrapping", () => {
  it("returns the bare body when there is no { status, data } envelope", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/cnam/2015551234": () => ({
        status: 200,
        body: JSON.stringify({ cnam: "VOICETEL", number: "2015551234" }),
      }),
    });
    const r = await client.lookups.cnam("2015551234");
    expect(r.cnam).toBe("VOICETEL");
  });

  it("rejects malformed JSON on a 2xx response", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/account": () => ({ status: 200, body: "{not json}" }),
    });
    await expect(client.account.get()).rejects.toThrow(/non-JSON success response/);
  });
});
