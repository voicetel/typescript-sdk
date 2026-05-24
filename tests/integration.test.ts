/**
 * Live read-only checks against api.voicetel.com.
 *
 * Gated on VOICETEL_USERNAME + VOICETEL_PASSWORD env vars — skipped otherwise.
 * None of these mutate server state.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { VoiceTelClient } from "../src/index.js";

const username = process.env.VOICETEL_USERNAME;
const password = process.env.VOICETEL_PASSWORD;
const baseUrl = process.env.VOICETEL_BASE_URL;

const skip = !username || !password;

describe.skipIf(skip)("integration (live API, read-only)", () => {
  let client: VoiceTelClient;

  beforeAll(async () => {
    client = new VoiceTelClient({ baseUrl: baseUrl || undefined });
    await client.login(Number(username), password!);
  });

  it("login installs an API key", () => {
    expect(client.apiKey).toBeTruthy();
  });

  it("can fetch the account profile", async () => {
    const me = await client.account.get();
    expect(me).toBeDefined();
    expect(me.username).toBeTruthy();
  });

  it("can list numbers", async () => {
    const data = await client.numbers.list();
    expect(data).toBeDefined();
    expect(data.numbers).toBeInstanceOf(Array);
  });

  it("can list gateways", async () => {
    const data = await client.gateways.list();
    expect(data).toBeDefined();
    expect(data.gateways).toBeInstanceOf(Array);
    expect(data.gateways.length).toBeGreaterThan(0);
  });

  it("can list ACL entries", async () => {
    const data = await client.acl.list();
    expect(data).toBeDefined();
    expect(data.acl).toBeInstanceOf(Array);
  });

  it("can fetch authentication settings", async () => {
    const data = await client.authentication.get();
    expect(data).toBeDefined();
    expect(data.authType).toBeDefined();
  });
});
