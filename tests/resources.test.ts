import { describe, expect, it } from "vitest";
import {
  type AclModifyRequest,
  type DirectoryListingRequest,
  type MessageSendRequest,
  type NumberAddRequest,
  type NumberCampaignAssignRequest,
  type NumberCnamRequest,
  type NumberFaxRequest,
  type NumberForwardRequest,
  type NumberLidbRequest,
  type NumberMessagingPatchRequest,
  type NumberMoveRequest,
  type NumberRouteRequest,
  type NumberSmsRequest,
  type NumberTranslationRequest,
  type OrderCreateRequest,
  type PortOutPinUpdateRequest,
  type PortSubmitRequest,
  type TicketCreateRequest,
  type TicketReplyRequest,
  type TicketUpdateRequest,
} from "../src/index.js";
import { accepted, buildMockClient, created, noContent, ok } from "./helpers.js";

// ----------------------------------------------------------------- Account ---

describe("AccountService", () => {
  it("walks every operation", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/account": () =>
        ok({
          username: "1",
          name: "Acme",
          cash: 12.5,
          rates: { sms: 0.01 },
          services: { sms: true },
        }),
      "PUT /v2.2/account": (req) => {
        expect(req.body).toEqual({ timezone: "UTC" });
        return ok({ updated: ["timezone"] });
      },
      "POST /v2.2/account": () => created({ username: "2", password: "p" }),
      "POST /v2.2/accounts": (req) => {
        // Public endpoint — no bearer even though the client has one.
        expect(req.headers["Authorization"]).toBeUndefined();
        return created({ username: "3", password: "q" });
      },
      "GET /v2.2/account/cdr": (req) => {
        expect(new URL(req.url).searchParams.get("start")).toBe("1");
        return ok({ start: 1, end: 2, cdr: [{ id: "r1", key: ["1", "2"], value: { dur: "40" } }] });
      },
      "GET /v2.2/account/credits": (req) => {
        expect(new URL(req.url).searchParams.get("status")).toBe("unpaid");
        return ok({ credits: [{ amount: 25, date: "x", paid: false }] });
      },
      "GET /v2.2/account/recurring-charges": () =>
        ok({ charges: [{ amount: 0.5, description: "DID" }], total: 0.5 }),
      "GET /v2.2/account/payments": () =>
        ok({ payments: [{ amount: 25, date: "x", status: "Completed" }] }),
      "GET /v2.2/account/registration": () => ok({ agent: "Zoiper", uri: "sip:x" }),
      "POST /v2.2/account/recovery": () => ok({ message: "sent" }),
    });

    const me = await client.account.get();
    expect(me.cash).toBe(12.5);
    expect(me.services?.sms).toBe(true);
    expect((await client.account.update({ timezone: "UTC" })).updated).toEqual(["timezone"]);
    expect((await client.account.add({ username: "2", name: "S", email: "s@x.com" })).password).toBe("p");
    expect((await client.account.signup({ name: "S", email: "s@x.com" })).password).toBe("q");
    const cdr = await client.account.cdr({ start: 1, end: 2 });
    expect(cdr.cdr[0]!.value.dur).toBe("40");
    expect((await client.account.credits({ status: "unpaid" })).credits[0]!.amount).toBe(25);
    expect((await client.account.recurringCharges()).total).toBe(0.5);
    expect((await client.account.payments()).payments[0]!.status).toBe("Completed");
    expect((await client.account.registration()).agent).toBe("Zoiper");
    expect((await client.account.recover({ email: "x@y.com" })).message).toBe("sent");
  });
});

// ----------------------------------------------------------------------- ACL ---

describe("AclService", () => {
  it("walks list / add / remove", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/acl": () => ok({ acl: [{ cidr: "203.0.113.0/24" }] }),
      "POST /v2.2/acl": () => ok({ added: [{ cidr: "203.0.113.0/24" }] }),
      "DELETE /v2.2/acl": (req) => {
        // No body — the CIDRs go out as a comma-separated query parameter.
        expect(req.body).toBeUndefined();
        expect(new URL(req.url).searchParams.get("cidrs")).toBe("203.0.113.0/24,203.0.113.9/32");
        return ok({ removed: [{ cidr: "203.0.113.0/24" }] });
      },
    });
    const body: AclModifyRequest = { acl: [{ cidr: "203.0.113.0/24" }] };
    expect((await client.acl.list()).acl[0]!.cidr).toBe("203.0.113.0/24");
    expect((await client.acl.add(body)).added[0]!.cidr).toBe("203.0.113.0/24");
    expect((await client.acl.remove(["203.0.113.0/24", "203.0.113.9/32"])).removed[0]!.cidr).toBe(
      "203.0.113.0/24",
    );
  });
});

// --------------------------------------------------------------- Authentication ---

describe("AuthenticationService", () => {
  it("get + update", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/auth": () =>
        ok({ authType: 1, authTypeDescription: "IP Auth", acl: [{ cidr: "203.0.113.0/24" }] }),
      "PUT /v2.2/auth": () => ok({ updated: [{ field: "authType", value: 2 }] }),
    });
    expect((await client.authentication.get()).authType).toBe(1);
    expect((await client.authentication.update({ authType: 2 })).updated[0]!.value).toBe(2);
  });
});

// ------------------------------------------------------------------------ E911 ---

describe("E911Service", () => {
  it("walks the full surface", async () => {
    const hexAddressId = "123a45b678c9d012e3f45a67b890c123";
    const record = {
      dn: "12015550123",
      callername: "ACME",
      address1: "1 Main",
      city: "Closter",
      state: "NJ",
      zip: "07624",
    };
    const { client } = buildMockClient({
      "GET /v2.2/e911": () => ok({ records: [record] }),
      "POST /v2.2/e911": () => created({ record }),
      "POST /v2.2/e911/validations": () =>
        ok({ address: { addressid: hexAddressId, address1: "1 Main", city: "Closter", state: "NJ", zip: "07624" } }),
      "GET /v2.2/e911/2015550123": () => ok({ record }),
      "PUT /v2.2/e911/2015550123": (req) => {
        // v2.2.20: addressid is a hex STRING and round-trips unchanged.
        expect(req.body).toEqual({ callername: "ACME", addressid: hexAddressId });
        return ok({ record });
      },
      "DELETE /v2.2/e911/2015550123": () => noContent,
    });

    expect((await client.e911.list()).records[0]!.dn).toBe("12015550123");
    expect(
      (
        await client.e911.create({
          dn: "2015550123",
          callername: "ACME",
          address1: "1 Main",
          city: "Closter",
          state: "NJ",
          zip: "07624",
        })
      ).record.callername,
    ).toBe("ACME");
    const validated = await client.e911.validate({
      address1: "1 Main",
      city: "Closter",
      state: "NJ",
      zip: "07624",
    });
    expect(validated.address.addressid).toBe(hexAddressId);
    expect((await client.e911.get("2015550123")).record.dn).toBe("12015550123");
    expect(
      (
        await client.e911.provision("2015550123", {
          callername: "ACME",
          addressid: validated.address.addressid,
        })
      ).record.dn,
    ).toBe("12015550123");
    await expect(client.e911.remove("2015550123")).resolves.toBeUndefined();
  });
});

// --------------------------------------------------------------------- Gateways ---

describe("GatewaysService", () => {
  it("walks the full surface", async () => {
    const gw = { id: 1000, gateway: "1.2.3.4:5060", prefix: "9", limit: 23, system: false };
    const { client } = buildMockClient({
      "GET /v2.2/gateways": () => ok({ gateways: [gw] }),
      "POST /v2.2/gateways": () => created(gw),
      "GET /v2.2/gateways/1000": () => ok(gw),
      "PUT /v2.2/gateways/1000": () => ok(gw),
      "DELETE /v2.2/gateways/1000": () => noContent,
      "GET /v2.2/gateways/1000/numbers": () =>
        ok({
          numbers: [
            {
              number: "2015550123",
              translated: "2015550123",
              forward: false,
              forwardTo: null,
              cnam: false,
              carrier: 0,
              smsEnabled: false,
              faxEnabled: false,
            },
          ],
        }),
    });
    expect((await client.gateways.list()).gateways[0]!.id).toBe(1000);
    expect((await client.gateways.add({ gateway: "1.2.3.4:5060" })).id).toBe(1000);
    expect((await client.gateways.get(1000)).prefix).toBe("9");
    expect((await client.gateways.update(1000, { prefix: "9" })).id).toBe(1000);
    await expect(client.gateways.remove(1000)).resolves.toBeUndefined();
    expect((await client.gateways.numbers(1000)).numbers[0]!.number).toBe("2015550123");
  });
});

// ---------------------------------------------------------------------- Lookups ---

describe("LookupsService", () => {
  it("cnam + lrn", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/cnam/2015550100": () => ok({ cnam: "VOICETEL", number: "2015550100" }),
      "GET /v2.2/lrn/2015550123/2015550100": () =>
        ok({ ani: "2015550100", destination: "2015550123", lrn: { lrn: "12125550000", state: "NY" } }),
    });
    expect((await client.lookups.cnam("2015550100")).cnam).toBe("VOICETEL");
    expect((await client.lookups.lrn("2015550123", "2015550100")).lrn.lrn).toBe("12125550000");
  });

  it("carrier lookup keeps the upstream snake_case field names", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/carrier/2015550123": () =>
        ok({
          number: "2015550123",
          carrier: {
            name: "EXAMPLE CARRIER",
            type: "voip",
            mobile_country_code: null,
            mobile_network_code: null,
            error_code: null,
          },
        }),
    });
    const data = await client.lookups.carrier("2015550123");
    expect(captured[0]!.url).toBe("https://api.voicetel.test/v2.2/carrier/2015550123");
    expect(data.number).toBe("2015550123");
    expect(data.carrier.name).toBe("EXAMPLE CARRIER");
    expect(data.carrier.type).toBe("voip");
    // Wire names are the upstream carrier's — NOT renamed by the SDK.
    expect(data.carrier.mobile_country_code).toBeNull();
    expect(data.carrier.mobile_network_code).toBeNull();
    expect(data.carrier.error_code).toBeNull();
  });

  it("carrier lookup on a mobile number", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/carrier/2015550199": () =>
        ok({
          number: "2015550199",
          carrier: {
            name: "EXAMPLE MOBILE",
            type: "mobile",
            mobile_country_code: "310",
            mobile_network_code: "456",
            error_code: null,
          },
        }),
    });
    const { carrier } = await client.lookups.carrier("2015550199");
    expect(carrier.mobile_country_code).toBe("310");
    expect(carrier.mobile_network_code).toBe("456");
  });
});

// -------------------------------------------------------------------- Messaging ---

describe("MessagingService", () => {
  it("walks the full surface", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/messages": (req) => {
        const q = new URL(req.url).searchParams;
        expect(q.get("number")).toBe("2015550100");
        expect(q.get("from")).toBe("2");
        expect(q.get("to")).toBe("1");
        expect(q.get("type")).toBe("sms");
        return ok({
          number: "2015550100",
          type: "sms",
          fromTs: 2,
          toTs: 1,
          messages: [
            {
              id: "r1",
              key: ["12015550100", 1747345100],
              value: {
                direction: "out",
                number: "12015550123",
                message: "hi",
                rate: "0.0150",
                ip: "203.0.113.10",
              },
            },
          ],
        });
      },
      "POST /v2.2/messages": () =>
        created({
          id: "x",
          type: "sms",
          fromNumber: "2015550100",
          toNumber: "2015550123",
          parts: 1,
        }),
      "POST /v2.2/messaging/brands": () =>
        created({ result: { statusCode: "200", status: "Success" } }),
      "GET /v2.2/messaging/campaigns": (req) => {
        expect(new URL(req.url).searchParams.get("ids")).toBe("C1,C2");
        return ok({
          campaigns: [
            {
              id: "C1",
              status: "CAMPAIGN_DCA_COMPLETE",
              numbers: ["2015550123"],
              dca: {
                electionComplete: true,
                electedCarriers: ["AT&T", "T-Mobile"],
                carriers: [
                  {
                    carrier: "T-Mobile",
                    status: "ACTIVE",
                    detail: "Campaign approved",
                    updatedAt: "2026-10-13T09:30:00Z",
                  },
                ],
              },
            },
            {
              id: "C2",
              status: "CAMPAIGN_INVALID_ID",
              numbers: [],
              dca: null,
            },
          ],
        });
      },
      "POST /v2.2/messaging/campaigns": () =>
        created({ result: { statusCode: "200", status: "Success" } }),
      "GET /v2.2/numbers/messaging": () => ok({ numbers: [] }),
    });

    const send: MessageSendRequest = {
      fromNumber: "2015550100",
      toNumber: "2015550123",
      text: "hi",
    };
    const history = await client.messaging.history({ number: "2015550100", from: 2, to: 1, type: "sms" });
    expect(history.type).toBe("sms");
    // v2.2.20 field: ip on outbound sms records.
    expect(history.messages[0]!.value.ip).toBe("203.0.113.10");
    expect((await client.messaging.send(send)).id).toBe("x");
    expect(
      (
        await client.messaging.createBrand({
          messagingBrandId: "BABC",
          messagingBrandName: "X",
        })
      ).result.status,
    ).toBe("Success");
    const campaigns = (await client.messaging.campaignStatus(["C1", "C2"])).campaigns;
    expect(campaigns[0]!.id).toBe("C1");
    expect(campaigns[0]!.dca!.electionComplete).toBe(true);
    expect(campaigns[0]!.dca!.carriers[0]!.carrier).toBe("T-Mobile");
    expect(campaigns[1]!.dca).toBeNull();
    expect(
      (
        await client.messaging.createCampaign({
          messagingBrandId: "B",
          externalCampaignId: "C",
          campaignDescription: "d",
        })
      ).result.status,
    ).toBe("Success");
    expect((await client.messaging.numbersState(["2015550123"])).numbers).toEqual([]);
  });

  it("walks the messaging-health surface (v2.2.15, raw responses)", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/messaging/health": () => ok({ summary: { numbers: 3, healthy: 2 } }),
      "GET /v2.2/messaging/health/alerts": () => ok({ enabled: true }),
      "PUT /v2.2/messaging/health/alerts": (req) => {
        expect(req.body).toEqual({ enabled: false });
        return ok({ enabled: false });
      },
      "POST /v2.2/messaging/health/check": (req) => {
        expect(req.body).toEqual({ number: "2125550123" });
        return ok({ number: "2125550123", inService: true });
      },
      "GET /v2.2/messaging/health/samples": (req) => {
        expect(new URL(req.url).searchParams.get("number")).toBe("2125550123");
        return ok([{ time: "2026-10-13T09:30:00Z", text: "hi", reason: "spam" }]);
      },
    });

    // The spec defines no response schema for these, so the SDK returns the decoded JSON as-is.
    expect((await client.messaging.health())["summary"]).toEqual({ numbers: 3, healthy: 2 });
    expect((await client.messaging.healthAlerts())["enabled"]).toBe(true);
    expect((await client.messaging.setHealthAlerts(false))["enabled"]).toBe(false);
    expect((await client.messaging.healthCheck("2125550123"))["inService"]).toBe(true);
    const samples = await client.messaging.healthSamples("2125550123");
    expect(Array.isArray(samples)).toBe(true);
    expect(samples[0]).toEqual({ time: "2026-10-13T09:30:00Z", text: "hi", reason: "spam" });
  });

  it("sends a media-only MMS (text is optional since v2.2.20)", async () => {
    const { client } = buildMockClient({
      "POST /v2.2/messages": (req) => {
        // No `text` on the wire — media-only MMS.
        expect(req.body).toEqual({
          fromNumber: "2015550100",
          toNumber: "2015550123",
          mediaUrls: ["https://cdn.example.test/photo.jpg"],
        });
        return created({
          id: "mms-1",
          type: "mms",
          fromNumber: "2015550100",
          toNumber: "2015550123",
          parts: 1,
          mediaUrls: ["https://cdn.example.test/photo.jpg"],
        });
      },
    });
    const send: MessageSendRequest = {
      fromNumber: "2015550100",
      toNumber: "2015550123",
      mediaUrls: ["https://cdn.example.test/photo.jpg"],
    };
    const sent = await client.messaging.send(send);
    expect(sent.type).toBe("mms");
    expect(sent.mediaUrls).toEqual(["https://cdn.example.test/photo.jpg"]);
  });

  it("message history carries the v2.2.20 dlr / mms field set", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/messages": (req) => {
        expect(new URL(req.url).searchParams.get("type")).toBe("dlr");
        return ok({
          number: "2015550100",
          type: "dlr",
          fromTs: 2,
          toTs: 1,
          messages: [
            {
              id: "d1",
              key: ["1", "12015550100", 1747345100],
              value: {
                sourceNumber: "12015550100",
                destinationNumber: "12015550123",
                messageText:
                  "id:1793144711856jfw sub:001 dlvrd:001 stat:DELIVRD err:000 text:delivered",
                transactionGUID: "1793144711856jfw",
                concatenatedMessage: "2",
              },
            },
          ],
        });
      },
    });
    const dlr = await client.messaging.history({ number: "2015550100", from: 2, to: 1, type: "dlr" });
    expect(dlr.messages[0]!.value.transactionGUID).toBe("1793144711856jfw");
    expect(dlr.messages[0]!.value.messageText).toContain("stat:DELIVRD");
    expect(dlr.messages[0]!.value.concatenatedMessage).toBe("2");
  });

  it("message history exposes mms attachments and subject", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/messages": () =>
        ok({
          number: "2015550100",
          type: "mms",
          fromTs: 2,
          toTs: 1,
          messages: [
            {
              id: "m1",
              key: ["1", "2015550100", 1747345100],
              value: {
                direction: "in",
                number: "2015550123",
                attachments: [
                  {
                    contentFile: "https://files.example.test/mms/abc.jpg",
                    "Content-Type": "image/jpeg",
                    fileName: "abc.jpg",
                    extension: "jpg",
                  },
                ],
                subject: "Photo",
              },
            },
            {
              id: "m2",
              key: ["1", "2015550100", 1747345110],
              value: {
                direction: "out",
                number: "2015550123",
                attachments: "https://cdn.example.test/photo.jpg",
              },
            },
          ],
        }),
    });
    const mms = await client.messaging.history({ number: "2015550100", type: "mms" });
    expect(mms.messages[0]!.value.subject).toBe("Photo");
    expect(mms.messages[0]!.value.attachments).toEqual([
      {
        contentFile: "https://files.example.test/mms/abc.jpg",
        "Content-Type": "image/jpeg",
        fileName: "abc.jpg",
        extension: "jpg",
      },
    ]);
    // Outbound attachments are the submitted media URL(s) — string or array.
    expect(mms.messages[1]!.value.attachments).toBe("https://cdn.example.test/photo.jpg");
  });
});

// ---------------------------------------------------------------------- Numbers ---

describe("NumbersService", () => {
  it("walks the full surface", async () => {
    const nd = {
      number: "2015550123",
      translated: "2015550123",
      route: 4,
      gateway: "1.2.3.4",
      cnam: true,
      forward: false,
      forwardTo: null,
      carrier: 0,
      smsEnabled: true,
      faxEnabled: false,
    };
    const { client } = buildMockClient({
      "GET /v2.2/numbers": () => ok({ numbers: [nd] }),
      "POST /v2.2/numbers": () => created({ number: "2015550123", route: 4 }),
      "GET /v2.2/numbers/2015550123": () => ok(nd),
      "DELETE /v2.2/numbers/2015550123": () => noContent,
      "PATCH /v2.2/numbers/2015550123": () =>
        ok({ number: "2015550123", accountId: 99, route: 4 }),
      "POST /v2.2/numbers/2015550123/release": () => noContent,
      "PUT /v2.2/numbers/2015550123/route": () => ok({ number: "2015550123", route: 4 }),
      "PUT /v2.2/numbers/2015550123/translation": () =>
        ok({ number: "2015550123", translation: "2015551235" }),
      "PUT /v2.2/numbers/2015550123/cnam": () => ok({ number: "2015550123", cnam: true }),
      "PUT /v2.2/numbers/2015550123/lidb": () =>
        ok({
          number: "2015550123",
          cnam: "ACME",
          customerOrderReference: "r1",
          carrierStatus: "Success",
        }),
      "GET /v2.2/numbers/2015550123/fax": () => ok({ number: "2015550123", email: "f@x.com" }),
      "PUT /v2.2/numbers/2015550123/fax": () => ok({ number: "2015550123", email: "f@x.com" }),
      "DELETE /v2.2/numbers/2015550123/fax": () => noContent,
      "PUT /v2.2/numbers/2015550123/forward": () =>
        ok({ number: "2015550123", forwardTo: "2125550123" }),
      "DELETE /v2.2/numbers/2015550123/forward": () => noContent,
      "GET /v2.2/numbers/2015550123/sms": () =>
        ok({ number: "2015550123", type: "email", resource: "x@y.com" }),
      "PUT /v2.2/numbers/2015550123/sms": () =>
        ok({ number: "2015550123", type: "email", resource: "x@y.com" }),
      "DELETE /v2.2/numbers/2015550123/sms": () => noContent,
      "GET /v2.2/numbers/2015550123/messaging": () =>
        ok({
          number: "2015550123",
          enabled: true,
          carrier: 16,
          routeIn: 0,
          resource: "x",
          network: "A",
          campaign: null,
        }),
      "PATCH /v2.2/numbers/2015550123/messaging": () =>
        ok({ number: "2015550123", updated: ["routeIn"] }),
      "PUT /v2.2/numbers/2015550123/messaging-campaign": () =>
        ok({
          number: "2015550123",
          campaignId: "C1",
          carrier: 17,
          network: "A",
          upstreamCnpId: "CAMP004",
          previousNetwork: null,
          previousNetworkCleared: false,
        }),
      "DELETE /v2.2/numbers/2015550123/messaging-campaign": (req) => {
        expect(req.body).toBeUndefined();
        expect(new URL(req.url).searchParams.get("campaignId")).toBe("C1");
        return ok({
          number: "2015550123",
          campaignId: "C1",
          network: "A",
          upstreamCnpId: "CAMP004",
          unassigned: true,
        });
      },
      "DELETE /v2.2/numbers/messaging-campaign": (req) => {
        expect(req.body).toBeUndefined();
        const q = new URL(req.url).searchParams;
        expect(q.get("numbers")).toBe("2015550123,2015551235");
        expect(q.get("campaignId")).toBe("C1");
        return ok({
          campaignId: "C1",
          network: "A",
          upstreamCnpId: "CAMP004",
          unassignedNumbers: ["2015550123", "2015551235"],
          failed: [],
        });
      },
      "PATCH /v2.2/numbers/2015550123/port-out-pin": () =>
        ok({ number: "2015550123", portOutPin: "1234" }),
      "GET /v2.2/numbers/2015550123/directory-listing": () =>
        ok({
          number: "2015550123",
          status: "listed",
          eligible: true,
          listing: {
            type: "B",
            name: "Acme Corp",
            streetNumber: "100",
            streetName: "Broadway",
            streetType: "St",
            streetSuffix: "",
            location: "Suite 900",
            city: "New York",
            state: "NY",
            zip: "10005",
            complex: false,
          },
          pending: null,
        }),
      "PUT /v2.2/numbers/2015550123/directory-listing": (req) => {
        expect(req.body).toEqual({
          type: "business",
          name: "Acme Corp",
          city: "New York",
          state: "NY",
          zip: "10005",
        });
        return accepted({
          number: "2015550123",
          status: "pending",
          orderId: "1026472",
          listing: {
            type: "B",
            name: "Acme Corp",
            city: "New York",
            state: "NY",
            zip: "10005",
          },
        });
      },
      "DELETE /v2.2/numbers/2015550123/directory-listing": () =>
        accepted({ number: "2015550123", status: "removing", orderId: "1026473" }),
    });

    expect((await client.numbers.list()).numbers[0]!.route).toBe(4);
    const addBody: NumberAddRequest = { number: "2015550123" };
    expect((await client.numbers.add(addBody)).route).toBe(4);
    expect((await client.numbers.get("2015550123")).cnam).toBe(true);
    await expect(client.numbers.remove("2015550123")).resolves.toBeUndefined();
    const move: NumberMoveRequest = { accountId: 99, route: 4 };
    expect((await client.numbers.move("2015550123", move)).accountId).toBe(99);
    await expect(client.numbers.release("2015550123")).resolves.toBeUndefined();
    const route: NumberRouteRequest = { route: 4 };
    expect((await client.numbers.setRoute("2015550123", route)).route).toBe(4);
    const tr: NumberTranslationRequest = { translation: "2015551235" };
    expect((await client.numbers.setTranslation("2015550123", tr)).translation).toBe(
      "2015551235",
    );
    const cn: NumberCnamRequest = { enabled: true };
    expect((await client.numbers.setCnam("2015550123", cn)).cnam).toBe(true);
    const lidb: NumberLidbRequest = { cnam: "ACME" };
    expect((await client.numbers.setLidb("2015550123", lidb)).carrierStatus).toBe("Success");
    expect((await client.numbers.getFax("2015550123")).email).toBe("f@x.com");
    const fax: NumberFaxRequest = { email: "f@x.com" };
    expect((await client.numbers.setFax("2015550123", fax)).email).toBe("f@x.com");
    await expect(client.numbers.removeFax("2015550123")).resolves.toBeUndefined();
    const fwd: NumberForwardRequest = { destination: "2125550123" };
    expect((await client.numbers.setForward("2015550123", fwd)).forwardTo).toBe("2125550123");
    await expect(client.numbers.removeForward("2015550123")).resolves.toBeUndefined();
    expect((await client.numbers.getSms("2015550123")).type).toBe("email");
    const sms: NumberSmsRequest = { type: "email", resource: "x@y.com" };
    expect((await client.numbers.setSms("2015550123", sms)).resource).toBe("x@y.com");
    await expect(client.numbers.removeSms("2015550123")).resolves.toBeUndefined();
    expect((await client.numbers.getMessaging("2015550123")).network).toBe("A");
    const pm: NumberMessagingPatchRequest = { routeIn: 1 };
    expect((await client.numbers.patchMessaging("2015550123", pm)).updated).toEqual(["routeIn"]);
    const ac: NumberCampaignAssignRequest = { campaignId: "C1" };
    expect((await client.numbers.assignCampaign("2015550123", ac)).carrier).toBe(17);
    expect((await client.numbers.unassignCampaign("2015550123", "C1")).unassigned).toBe(true);
    expect(
      (await client.numbers.bulkUnassignCampaign(["2015550123", "2015551235"], "C1"))
        .unassignedNumbers,
    ).toEqual(["2015550123", "2015551235"]);
    const pin: PortOutPinUpdateRequest = { pin: "1234" };
    expect((await client.numbers.setPortOutPin("2015550123", pin)).portOutPin).toBe("1234");
    // Directory listing (v2.2.20) — GET published state, PUT/DELETE accepted (202).
    const listed = await client.numbers.getDirectoryListing("2015550123");
    expect(listed.status).toBe("listed");
    expect(listed.eligible).toBe(true);
    expect(listed.listing?.name).toBe("Acme Corp");
    expect(listed.pending).toBeNull();
    const listing: DirectoryListingRequest = {
      type: "business",
      name: "Acme Corp",
      city: "New York",
      state: "NY",
      zip: "10005",
    };
    const put = await client.numbers.setDirectoryListing("2015550123", listing);
    expect(put.status).toBe("pending");
    expect(put.orderId).toBe("1026472");
    const removed = await client.numbers.removeDirectoryListing("2015550123");
    expect(removed.status).toBe("removing");
    expect(removed.orderId).toBe("1026473");
  });

  it("directory listing: residence listing and cancel of a pending add", async () => {
    const { client } = buildMockClient({
      "PUT /v2.2/numbers/2015550199/directory-listing": (req) => {
        expect(req.body).toEqual({
          type: "residence",
          firstName: "Jane",
          lastName: "Doe",
          city: "New York",
          state: "NY",
          zip: "10005",
        });
        return accepted({
          number: "2015550199",
          status: "pending",
          orderId: null,
          listing: { type: "R", firstName: "Jane", lastName: "Doe", city: "New York", state: "NY", zip: "10005" },
        });
      },
      "DELETE /v2.2/numbers/2015550199/directory-listing": () =>
        // Cancel of a pending add: not_listed, no orderId.
        accepted({ number: "2015550199", status: "not_listed" }),
    });
    const residence: DirectoryListingRequest = {
      type: "residence",
      firstName: "Jane",
      lastName: "Doe",
      city: "New York",
      state: "NY",
      zip: "10005",
    };
    const put = await client.numbers.setDirectoryListing("2015550199", residence);
    expect(put.status).toBe("pending");
    expect(put.listing?.type).toBe("R");
    const cancel = await client.numbers.removeDirectoryListing("2015550199");
    expect(cancel.status).toBe("not_listed");
    expect("orderId" in cancel).toBe(false);
  });

  it("accepts gateway ids as routes (v2.2.20: routes are no longer limited to the global 1–9 enum)", async () => {
    const { client } = buildMockClient({
      "PUT /v2.2/numbers/2015550123/route": (req) => {
        expect(req.body).toEqual({ route: 1000 });
        return ok({ number: "2015550123", route: 1000 });
      },
      "PATCH /v2.2/numbers/2015550123": (req) => {
        expect(req.body).toEqual({ accountId: 99, route: 1000 });
        return ok({ number: "2015550123", accountId: 99, route: 1000 });
      },
    });
    expect((await client.numbers.setRoute("2015550123", { route: 1000 })).route).toBe(1000);
    expect((await client.numbers.move("2015550123", { accountId: 99, route: 1000 })).route).toBe(1000);
  });
});

// ---------------------------------------------------------------------- Support ---

describe("SupportService", () => {
  it("walks the full surface", async () => {
    const ticket = { id: 1, status: "active" as const, subject: "S", number: "1015" };
    const { client } = buildMockClient({
      "GET /v2.2/support/tickets": () => ok({ totalCount: 1, tickets: [ticket] }),
      "POST /v2.2/support/tickets": () => created({ ticket }),
      "GET /v2.2/support/tickets/1": () => ok({ ticket }),
      "PUT /v2.2/support/tickets/1": () => ok({ id: 1, status: "success" }),
      "DELETE /v2.2/support/tickets/1": () => noContent,
      "GET /v2.2/support/tickets/1/messages": () => ok({ messages: [] }),
      "POST /v2.2/support/tickets/1/replies": () => created({ message: "Reply added" }),
    });
    const list = await client.support.list();
    expect(list.totalCount).toBe(1);
    expect(list.tickets[0]!.id).toBe(1);
    const create: TicketCreateRequest = { subject: "s", message: "m" };
    expect((await client.support.create(create)).ticket.subject).toBe("S");
    expect((await client.support.get(1)).ticket.number).toBe("1015");
    const upd: TicketUpdateRequest = { status: "closed" };
    expect((await client.support.update(1, upd)).status).toBe("success");
    await expect(client.support.delete(1)).resolves.toBeUndefined();
    expect((await client.support.messages(1)).messages).toEqual([]);
    const rep: TicketReplyRequest = { message: "ok" };
    expect((await client.support.reply(1, rep)).message).toBe("Reply added");
  });
});

// ------------------------------------------------------------------- iNumbering ---

describe("INumberingService", () => {
  it("walks the full surface", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/inventory": (req) => {
        const q = new URL(req.url).searchParams;
        expect(q.get("tnMask")).toBe("201555*");
        expect(q.get("quantity")).toBe("10");
        expect(q.get("province")).toBe("NJ");
        return ok({
          numbers: [
            {
              number: "2015550103",
              rateCenter: "CLOSTER",
              city: "Closter",
              province: "NJ",
              lata: "224",
            },
          ],
        });
      },
      "GET /v2.2/inventory/coverage": (req) => {
        const q = new URL(req.url).searchParams;
        expect(q.get("countBy")).toBe("npanxx");
        expect(q.get("locState")).toBe("NJ");
        return ok({ coverage: [{ count: 100, npa: "201" }] });
      },
      "POST /v2.2/orders": (req) => {
        // Per-number route override — a gateway id is valid since v2.2.20.
        expect(req.body).toEqual({ numbers: [{ number: "2015550123", route: 1000 }] });
        return created({
          orderId: "1",
          amountCharged: 0.5,
          numbersOrdered: ["2015550123"],
          routes: [{ number: "2015550123", route: 1000 }],
          failed: [],
        });
      },
      "GET /v2.2/ports": () => ok({ ports: [{ id: "abc", status: "Complete" }] }),
      "GET /v2.2/ports/a3a2a": () => ok({ port: { id: "abc", status: "Complete" } }),
      "POST /v2.2/ports": () =>
        created({
          pid: "a3a2a",
          ticket: 2114,
          message: "ok",
          loaUrl: "https://x/loa",
          portUrl: "https://x/port",
        }),
      "GET /v2.2/ports/availability/2015550102": () =>
        ok({
          number: "2015550102",
          portable: true,
          losingCarrier: "Sinch Voice-NSR-10X-Port/1",
          localRoutingNumber: "6465550105",
          rateCenterTier: "0",
          reason: null,
        }),
    });

    expect(
      (await client.iNumbering.searchInventory({ tnMask: "201555*", quantity: 10, province: "NJ" }))
        .numbers[0]!.number,
    ).toBe("2015550103");
    expect((await client.iNumbering.coverage({ countBy: "npanxx", locState: "NJ" })).coverage[0]!.count).toBe(100);
    const order: OrderCreateRequest = { numbers: [{ number: "2015550123", route: 1000 }] };
    const placed = await client.iNumbering.order(order);
    expect(placed.orderId).toBe("1");
    // v2.2.20: the order response reports the route each number was placed on.
    expect(placed.routes).toEqual([{ number: "2015550123", route: 1000 }]);
    expect((await client.iNumbering.ports()).ports[0]!.id).toBe("abc");
    expect((await client.iNumbering.port("a3a2a")).port.id).toBe("abc");
    const port: PortSubmitRequest = {
      did: ["2015550123"],
      name: "Acme",
      nameType: "business",
      lcBtn: "2015550101",
      lcAccountNumber: "acct",
      streetNumber: "550",
      street: "Main",
      streetType: "ST",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "US",
      authPerson: "J",
    };
    expect((await client.iNumbering.submitPort(port)).pid).toBe("a3a2a");
    const avail = await client.iNumbering.portAvailability("2015550102");
    expect(avail.portable).toBe(true);
    // v2.2.10 fields:
    expect(avail.localRoutingNumber).toBe("6465550105");
    expect(avail.rateCenterTier).toBe("0");
  });
});
