import { describe, expect, it } from "vitest";
import {
  type AclModifyRequest,
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
import { buildMockClient, created, noContent, ok } from "./helpers.js";

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
      "POST /v2.2/accounts": () => created({ username: "3", password: "q" }),
      "GET /v2.2/account/cdr": (req) => {
        expect(new URL(req.url).searchParams.get("start")).toBe("1");
        return ok({ start: 1, end: 2, cdr: [{ id: "r1", key: ["1", "2"], value: { dur: "40" } }] });
      },
      "GET /v2.2/account/credits": () => ok({ credits: [{ amount: 25, date: "x", paid: false }] }),
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
    expect((await client.account.add({ username: 2, name: "S", email: "s@x.com" })).password).toBe("p");
    expect((await client.account.signup({ name: "S", email: "s@x.com" })).password).toBe("q");
    const cdr = await client.account.cdr({ start: 1, end: 2 });
    expect(cdr.cdr[0]!.value.dur).toBe("40");
    expect((await client.account.credits()).credits[0]!.amount).toBe(25);
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
      "DELETE /v2.2/acl": () => ok({ removed: [{ cidr: "203.0.113.0/24" }] }),
    });
    const body: AclModifyRequest = { acl: [{ cidr: "203.0.113.0/24" }] };
    expect((await client.acl.list()).acl[0]!.cidr).toBe("203.0.113.0/24");
    expect((await client.acl.add(body)).added[0]!.cidr).toBe("203.0.113.0/24");
    expect((await client.acl.remove(body)).removed[0]!.cidr).toBe("203.0.113.0/24");
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
    const record = {
      dn: "12015551234",
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
        ok({ address: { addressid: 1, address1: "1 Main", city: "Closter", state: "NJ", zip: "07624" } }),
      "GET /v2.2/e911/2015551234": () => ok({ record }),
      "PUT /v2.2/e911/2015551234": () => ok({ record }),
      "DELETE /v2.2/e911/2015551234": () => noContent,
    });

    expect((await client.e911.list()).records[0]!.dn).toBe("12015551234");
    expect(
      (
        await client.e911.create({
          dn: "2015551234",
          callername: "ACME",
          address1: "1 Main",
          city: "Closter",
          state: "NJ",
          zip: "07624",
        })
      ).record.callername,
    ).toBe("ACME");
    expect(
      (
        await client.e911.validate({
          address1: "1 Main",
          city: "Closter",
          state: "NJ",
          zip: "07624",
        })
      ).address.addressid,
    ).toBe(1);
    expect((await client.e911.get("2015551234")).record.dn).toBe("12015551234");
    expect(
      (
        await client.e911.provision("2015551234", { callername: "ACME", addressid: 1 })
      ).record.dn,
    ).toBe("12015551234");
    await expect(client.e911.remove("2015551234")).resolves.toBeUndefined();
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
              number: "2015551234",
              translated: "2015551234",
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
    expect((await client.gateways.numbers(1000)).numbers[0]!.number).toBe("2015551234");
  });
});

// ---------------------------------------------------------------------- Lookups ---

describe("LookupsService", () => {
  it("cnam + lrn", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/cnam/2012548000": () => ok({ cnam: "VOICETEL", number: "2012548000" }),
      "GET /v2.2/lrn/2015551234/2012548000": () =>
        ok({ ani: "2012548000", destination: "2015551234", lrn: { lrn: "12125550000", state: "NY" } }),
    });
    expect((await client.lookups.cnam("2012548000")).cnam).toBe("VOICETEL");
    expect((await client.lookups.lrn("2015551234", "2012548000")).lrn.lrn).toBe("12125550000");
  });
});

// -------------------------------------------------------------------- Messaging ---

describe("MessagingService", () => {
  it("walks the full surface", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/messages": () =>
        ok({ number: "2012548000", type: "sms", fromTs: 1, toTs: 2, messages: [] }),
      "POST /v2.2/messages": () =>
        created({
          id: "x",
          type: "sms",
          fromNumber: "2012548000",
          toNumber: "2015551234",
          parts: 1,
        }),
      "POST /v2.2/messaging/brands": () =>
        created({ result: { statusCode: "200", status: "Success" } }),
      "GET /v2.2/messaging/campaigns": () =>
        ok({ campaigns: [{ id: "C1", status: "ACTIVE", numbers: ["2015551234"] }] }),
      "POST /v2.2/messaging/campaigns": () =>
        created({ result: { statusCode: "200", status: "Success" } }),
      "GET /v2.2/numbers/messaging": () => ok({ numbers: [] }),
    });

    const send: MessageSendRequest = {
      fromNumber: "2012548000",
      toNumber: "2015551234",
      text: "hi",
    };
    expect((await client.messaging.history({ number: "2012548000" })).type).toBe("sms");
    expect((await client.messaging.send(send)).id).toBe("x");
    expect(
      (
        await client.messaging.createBrand({
          messagingBrandId: "BABC",
          messagingBrandName: "X",
        })
      ).result.status,
    ).toBe("Success");
    expect((await client.messaging.campaignStatus()).campaigns[0]!.id).toBe("C1");
    expect(
      (
        await client.messaging.createCampaign({
          messagingBrandId: "B",
          externalCampaignId: "C",
          campaignDescription: "d",
        })
      ).result.status,
    ).toBe("Success");
    expect((await client.messaging.numbersState(["2015551234"])).numbers).toEqual([]);
    expect((await client.messaging.numbersState()).numbers).toEqual([]);
  });
});

// ---------------------------------------------------------------------- Numbers ---

describe("NumbersService", () => {
  it("walks the full surface", async () => {
    const nd = {
      number: "2015551234",
      translated: "2015551234",
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
      "POST /v2.2/numbers": () => created({ number: "2015551234", route: 4 }),
      "GET /v2.2/numbers/2015551234": () => ok(nd),
      "DELETE /v2.2/numbers/2015551234": () => noContent,
      "PATCH /v2.2/numbers/2015551234": () =>
        ok({ number: "2015551234", accountId: 99, route: 4 }),
      "POST /v2.2/numbers/2015551234/release": () => noContent,
      "PUT /v2.2/numbers/2015551234/route": () => ok({ number: "2015551234", route: 7 }),
      "PUT /v2.2/numbers/2015551234/translation": () =>
        ok({ number: "2015551234", translation: "2015551235" }),
      "PUT /v2.2/numbers/2015551234/cnam": () => ok({ number: "2015551234", cnam: true }),
      "PUT /v2.2/numbers/2015551234/lidb": () =>
        ok({
          number: "2015551234",
          cnam: "ACME",
          customerOrderReference: "r1",
          carrierStatus: "Success",
        }),
      "GET /v2.2/numbers/2015551234/fax": () => ok({ number: "2015551234", email: "f@x.com" }),
      "PUT /v2.2/numbers/2015551234/fax": () => ok({ number: "2015551234", email: "f@x.com" }),
      "DELETE /v2.2/numbers/2015551234/fax": () => noContent,
      "PUT /v2.2/numbers/2015551234/forward": () =>
        ok({ number: "2015551234", forwardTo: "2125551234" }),
      "DELETE /v2.2/numbers/2015551234/forward": () => noContent,
      "GET /v2.2/numbers/2015551234/sms": () =>
        ok({ number: "2015551234", type: "email", resource: "x@y.com" }),
      "PUT /v2.2/numbers/2015551234/sms": () =>
        ok({ number: "2015551234", type: "email", resource: "x@y.com" }),
      "DELETE /v2.2/numbers/2015551234/sms": () => noContent,
      "GET /v2.2/numbers/2015551234/messaging": () =>
        ok({
          number: "2015551234",
          enabled: true,
          carrier: 16,
          routeIn: 0,
          resource: "x",
          network: "A",
          campaign: null,
        }),
      "PATCH /v2.2/numbers/2015551234/messaging": () =>
        ok({ number: "2015551234", updated: ["routeIn"] }),
      "PUT /v2.2/numbers/2015551234/messaging-campaign": () =>
        ok({
          number: "2015551234",
          campaignId: "C1",
          carrier: 17,
          network: "A",
          upstreamCnpId: "SFL9UTQ",
          previousNetwork: null,
          previousNetworkCleared: false,
        }),
      "DELETE /v2.2/numbers/2015551234/messaging-campaign": () =>
        ok({
          number: "2015551234",
          campaignId: "C1",
          network: "A",
          upstreamCnpId: "SFL9UTQ",
          unassigned: true,
        }),
      "DELETE /v2.2/numbers/messaging-campaign": () =>
        ok({
          campaignId: "C1",
          network: "A",
          upstreamCnpId: "SFL9UTQ",
          unassignedNumbers: ["2015551234"],
          failed: [],
        }),
      "PATCH /v2.2/numbers/2015551234/port-out-pin": () =>
        ok({ number: "2015551234", portOutPin: "1234" }),
    });

    expect((await client.numbers.list()).numbers[0]!.route).toBe(4);
    const addBody: NumberAddRequest = { number: "2015551234" };
    expect((await client.numbers.add(addBody)).route).toBe(4);
    expect((await client.numbers.get("2015551234")).cnam).toBe(true);
    await expect(client.numbers.remove("2015551234")).resolves.toBeUndefined();
    const move: NumberMoveRequest = { accountId: 99, route: 4 };
    expect((await client.numbers.move("2015551234", move)).accountId).toBe(99);
    await expect(client.numbers.release("2015551234")).resolves.toBeUndefined();
    const route: NumberRouteRequest = { route: 7 };
    expect((await client.numbers.setRoute("2015551234", route)).route).toBe(7);
    const tr: NumberTranslationRequest = { translation: "2015551235" };
    expect((await client.numbers.setTranslation("2015551234", tr)).translation).toBe(
      "2015551235",
    );
    const cn: NumberCnamRequest = { enabled: true };
    expect((await client.numbers.setCnam("2015551234", cn)).cnam).toBe(true);
    const lidb: NumberLidbRequest = { cnam: "ACME" };
    expect((await client.numbers.setLidb("2015551234", lidb)).carrierStatus).toBe("Success");
    expect((await client.numbers.getFax("2015551234")).email).toBe("f@x.com");
    const fax: NumberFaxRequest = { email: "f@x.com" };
    expect((await client.numbers.setFax("2015551234", fax)).email).toBe("f@x.com");
    await expect(client.numbers.removeFax("2015551234")).resolves.toBeUndefined();
    const fwd: NumberForwardRequest = { destination: "2125551234" };
    expect((await client.numbers.setForward("2015551234", fwd)).forwardTo).toBe("2125551234");
    await expect(client.numbers.removeForward("2015551234")).resolves.toBeUndefined();
    expect((await client.numbers.getSms("2015551234")).type).toBe("email");
    const sms: NumberSmsRequest = { type: "email", resource: "x@y.com" };
    expect((await client.numbers.setSms("2015551234", sms)).resource).toBe("x@y.com");
    await expect(client.numbers.removeSms("2015551234")).resolves.toBeUndefined();
    expect((await client.numbers.getMessaging("2015551234")).network).toBe("A");
    const pm: NumberMessagingPatchRequest = { routeIn: 1 };
    expect((await client.numbers.patchMessaging("2015551234", pm)).updated).toEqual(["routeIn"]);
    const ac: NumberCampaignAssignRequest = { campaignId: "C1" };
    expect((await client.numbers.assignCampaign("2015551234", ac)).carrier).toBe(17);
    expect((await client.numbers.unassignCampaign("2015551234")).unassigned).toBe(true);
    expect((await client.numbers.bulkUnassignCampaign(["2015551234"])).unassignedNumbers).toEqual([
      "2015551234",
    ]);
    const pin: PortOutPinUpdateRequest = { pin: "1234" };
    expect((await client.numbers.setPortOutPin("2015551234", pin)).portOutPin).toBe("1234");
  });
});

// ---------------------------------------------------------------------- Support ---

describe("SupportService", () => {
  it("walks the full surface", async () => {
    const ticket = { id: 1, status: "active" as const, subject: "S", ticketNumber: 1015 };
    const { client } = buildMockClient({
      "GET /v2.2/support/tickets": () => ok({ tickets: [ticket] }),
      "POST /v2.2/support/tickets": () => created({ ticket }),
      "GET /v2.2/support/tickets/1": () => ok({ ticket }),
      "PUT /v2.2/support/tickets/1": () => ok({ id: 1, status: "success" }),
      "DELETE /v2.2/support/tickets/1": () => noContent,
      "GET /v2.2/support/tickets/1/messages": () => ok({ messages: [] }),
      "POST /v2.2/support/tickets/1/replies": () => created({ message: "Reply added" }),
    });
    expect((await client.support.list()).tickets[0]!.id).toBe(1);
    const create: TicketCreateRequest = { subject: "s", message: "m" };
    expect((await client.support.create(create)).ticket.subject).toBe("S");
    expect((await client.support.get(1)).ticket.id).toBe(1);
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
      "GET /v2.2/inventory": () =>
        ok({
          numbers: [
            {
              number: "2019085750",
              rateCenter: "CLOSTER",
              city: "Closter",
              province: "NJ",
              lata: "224",
            },
          ],
        }),
      "GET /v2.2/inventory/coverage": () => ok({ coverage: [{ count: 100, npa: "201" }] }),
      "POST /v2.2/orders": () =>
        created({
          orderId: "1",
          amountCharged: 0.5,
          numbersOrdered: ["2015551234"],
          failed: [],
        }),
      "GET /v2.2/ports": () => ok({ ports: [{ id: "abc", status: "Complete" }] }),
      "GET /v2.2/ports/42": () => ok({ port: { id: "abc", status: "Complete" } }),
      "POST /v2.2/ports": () =>
        created({
          pid: "a3a2a",
          ticket: 2114,
          message: "ok",
          loaUrl: "https://x/loa",
          portUrl: "https://x/port",
        }),
      "GET /v2.2/ports/availability/2017301000": () =>
        ok({
          number: "2017301000",
          portable: true,
          losingCarrier: "Sinch Voice-NSR-10X-Port/1",
          localRoutingNumber: "6463071993",
          rateCenterTier: "0",
          reason: null,
        }),
    });

    expect((await client.iNumbering.searchInventory({ state: "NJ", limit: 10 })).numbers[0]!.number).toBe(
      "2019085750",
    );
    expect((await client.iNumbering.coverage({ state: "NJ" })).coverage[0]!.count).toBe(100);
    const order: OrderCreateRequest = { numbers: ["2015551234"] };
    expect((await client.iNumbering.order(order)).orderId).toBe("1");
    expect((await client.iNumbering.ports()).ports[0]!.id).toBe("abc");
    expect((await client.iNumbering.port(42)).port.id).toBe("abc");
    const port: PortSubmitRequest = {
      did: ["2015551234"],
      name: "Acme",
      nameType: "business",
      lcBtn: "2015551000",
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
    const avail = await client.iNumbering.portAvailability("2017301000");
    expect(avail.portable).toBe(true);
    // v2.2.10 fields:
    expect(avail.localRoutingNumber).toBe("6463071993");
    expect(avail.rateCenterTier).toBe("0");
  });
});
