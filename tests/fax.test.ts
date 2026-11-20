import { describe, expect, it } from "vitest";
import { ApiError } from "../src/index.js";
import type { FaxJob } from "../src/index.js";
import { buildMockClient, ok } from "./helpers.js";

// The spec's example fax job — the full read shape shared by get + history.
const job: FaxJob = {
  id: "9f8c2b41a",
  fromNumber: "2015550123",
  toNumber: "2125550123",
  clientToken: "123e4567-e89b-12d3-a456-426614174000",
  status: "sent",
  submittedAt: "2026-11-20T15:04:05Z",
  startedAt: "2026-11-20T15:04:41Z",
  completedAt: "2026-11-20T15:05:19Z",
  attempts: 1,
  failureReason: null,
  documents: [{ name: "contract.pdf", size: 123456, contentType: "application/pdf" }],
  documentAvailable: true,
  documentName: "contract.pdf",
  documentSize: 123456,
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("FaxService", () => {
  it("numbers() lists fax-capable numbers with their delivery emails", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/numbers/fax": () =>
        ok({
          numbers: [
            { number: "2015550123", destinationId: 7, email: "fax@example.com" },
            { number: "2015551235", destinationId: 0, email: "account@example.com" },
          ],
        }),
    });
    const data = await client.fax.numbers();
    expect(data.numbers).toHaveLength(2);
    expect(data.numbers[0]!.number).toBe("2015550123");
    expect(data.numbers[0]!.destinationId).toBe(7);
    expect(data.numbers[1]!.destinationId).toBe(0); // delivers to the account email
    expect(captured[0]!.url).toBe("https://api.voicetel.test/v2.2/numbers/fax");
  });

  it("send() posts a multipart form with a UUID Idempotency-Key (201)", async () => {
    const pdfBytes = new TextEncoder().encode("%PDF-1.7 fake contract");
    const { client, captured } = buildMockClient({
      "POST /v2.2/faxes": (req) => {
        // The body is a real FormData — i.e. fetch sends multipart/form-data.
        expect(req.body).toBeInstanceOf(FormData);
        const contentType = new Response(req.body as BodyInit).headers.get("content-type");
        expect(contentType).toMatch(/^multipart\/form-data; boundary=/);

        const form = req.body as FormData;
        expect(form.get("fromNumber")).toBe("2015550123");
        expect(form.get("toNumber")).toBe("2125550123");
        const docs = form.getAll("documents");
        expect(docs).toHaveLength(2);
        expect((docs[0] as File).name).toBe("contract.pdf");
        expect((docs[1] as File).name).toBe("appendix.docx");

        // The header is a UUID, echoed back on the 201.
        const key = req.headers["Idempotency-Key"];
        expect(key).toMatch(UUID_RE);
        return {
          status: 201,
          headers: { "Idempotency-Key": key },
          body: JSON.stringify({
            status: "success",
            data: {
              id: "9f8c2b41a",
              fromNumber: "2015550123",
              toNumber: "2125550123",
              status: "queued",
              documents: [
                { name: "contract.pdf", size: pdfBytes.byteLength, contentType: "application/pdf" },
                {
                  name: "appendix.docx",
                  size: 4,
                  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
              ],
            },
          }),
        };
      },
    });

    const sent = await client.fax.send({
      fromNumber: "2015550123",
      toNumber: "2125550123",
      documents: [
        { name: "contract.pdf", data: pdfBytes },
        {
          name: "appendix.docx",
          data: "more",
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    });
    expect(sent.id).toBe("9f8c2b41a");
    expect(sent.status).toBe("queued");
    expect(sent.documents[0]).toEqual({
      name: "contract.pdf",
      size: pdfBytes.byteLength,
      contentType: "application/pdf",
    });
    // The generated key is visible to the caller for resubmission.
    expect(captured[0]!.headers["Idempotency-Key"]).toMatch(UUID_RE);
  });

  it("send() passes a caller-supplied idempotencyKey through unchanged", async () => {
    const key = "123e4567-e89b-12d3-a456-426614174000";
    const { client, captured } = buildMockClient({
      "POST /v2.2/faxes": () => ({
        status: 201,
        body: JSON.stringify({
          status: "success",
          data: {
            id: "9f8c2b41a",
            fromNumber: "2015550123",
            toNumber: "2125550123",
            status: "queued",
            documents: [],
          },
        }),
      }),
    });
    await client.fax.send({
      fromNumber: "2015550123",
      toNumber: "2125550123",
      documents: [{ name: "contract.pdf", data: "%PDF-1.7 x" }],
      idempotencyKey: key,
    });
    expect(captured[0]!.headers["Idempotency-Key"]).toBe(key);
  });

  it("send() maps the 402 needs-positive-balance error (tolerating serverTime)", async () => {
    const { client } = buildMockClient({
      "POST /v2.2/faxes": () => ({
        status: 402,
        body: JSON.stringify({
          status: "error",
          error: { code: 402, message: "Your account needs a positive balance to send faxes." },
          serverTime: 1795100000,
        }),
      }),
    });
    // The fax error envelope adds `serverTime` beside status/error — unknown
    // fields must not break parsing.
    await expect(
      client.fax.send({
        fromNumber: "2015550123",
        toNumber: "2125550123",
        documents: [{ name: "contract.pdf", data: "%PDF-1.7 x" }],
      }),
    ).rejects.toMatchObject({
      kind: "payment_required",
      statusCode: 402,
      code: 402,
      message: "Your account needs a positive balance to send faxes.",
    });
  });

  it("send() maps the 413 documents-over-8-MiB error", async () => {
    const { client } = buildMockClient({
      "POST /v2.2/faxes": () => ({
        status: 413,
        body: JSON.stringify({
          status: "error",
          error: { code: 413, message: "Documents exceed the 8 MiB limit." },
        }),
      }),
    });
    await expect(
      client.fax.send({
        fromNumber: "2015550123",
        toNumber: "2125550123",
        documents: [{ name: "contract.pdf", data: "%PDF-1.7 x" }],
      }),
    ).rejects.toMatchObject({
      kind: "payload_too_large",
      statusCode: 413,
      code: 413,
      message: "Documents exceed the 8 MiB limit.",
    });
  });

  it("history() sends the exact query names and unwraps the page", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/faxes": (req) => {
        const q = new URL(req.url).searchParams;
        expect(q.get("number")).toBe("2015550123");
        expect(q.get("from")).toBe("1795100000");
        expect(q.get("to")).toBe("1795013600");
        expect(q.get("limit")).toBe("100");
        expect(q.get("cursor")).toBe("cGl0LnN0b3Jl.abc123");
        expect(q.get("status")).toBe("failed");
        return ok({
          number: "2015550123",
          fromTs: 1795100000,
          toTs: 1795013600,
          faxes: [{ ...job, status: "failed", failureReason: "no answer" }],
          nextCursor: null,
        });
      },
    });
    const page = await client.fax.history({
      number: "2015550123",
      from: 1795100000,
      to: 1795013600,
      limit: 100,
      cursor: "cGl0LnN0b3Jl.abc123",
      status: "failed",
    });
    expect(page.number).toBe("2015550123");
    expect(page.faxes[0]!.status).toBe("failed");
    expect(page.faxes[0]!.failureReason).toBe("no answer");
    expect(page.nextCursor).toBeNull();
    expect(new URL(captured[0]!.url).pathname).toBe("/v2.2/faxes");
  });

  it("history() sends only the required number by default", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/faxes": () => ok({ number: "2015550123", fromTs: 2, toTs: 1, faxes: [job], nextCursor: "cur" }),
    });
    const page = await client.fax.history({ number: "2015550123" });
    expect(page.faxes[0]!.documents[0]!.name).toBe("contract.pdf");
    expect(page.nextCursor).toBe("cur");
    const q = new URL(captured[0]!.url).searchParams;
    expect(q.get("number")).toBe("2015550123");
    expect(q.has("from")).toBe(false);
    expect(q.has("to")).toBe(false);
    expect(q.has("limit")).toBe(false);
  });

  it("get() reads one job", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/faxes/9f8c2b41a": () => ok(job),
    });
    const one = await client.fax.get("9f8c2b41a");
    expect(one.id).toBe("9f8c2b41a");
    expect(one.clientToken).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(one.documentAvailable).toBe(true);
    expect(captured[0]!.url).toBe("https://api.voicetel.test/v2.2/faxes/9f8c2b41a");
  });

  it("get() URL-encodes the job id", async () => {
    const { client, captured } = buildMockClient({
      "GET /v2.2/faxes/a%2Bb_c": () => ok(job),
    });
    await client.fax.get("a+b_c");
    expect(captured[0]!.url).toBe("https://api.voicetel.test/v2.2/faxes/a%2Bb_c");
  });

  it("document() returns the raw PDF bytes", async () => {
    const pdf = "%PDF-1.7\nfake fax document bytes\n%%EOF";
    const { client, captured } = buildMockClient({
      "GET /v2.2/faxes/9f8c2b41a/document": () => ({
        status: 200,
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="contract.pdf"' },
        body: pdf,
      }),
    });
    const bytes = await client.fax.document("9f8c2b41a");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(bytes)).toBe(pdf);
    expect(captured[0]!.url).toBe("https://api.voicetel.test/v2.2/faxes/9f8c2b41a/document");
  });

  it("document() surfaces a 409-style JSON error even on the bytes path", async () => {
    const { client } = buildMockClient({
      "GET /v2.2/faxes/9f8c2b41a/document": () => ({
        status: 404,
        body: JSON.stringify({
          status: "error",
          error: { code: 404, message: "Not found" },
          serverTime: 1795100000,
        }),
      }),
    });
    try {
      await client.fax.document("9f8c2b41a");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.kind).toBe("not_found");
      expect(apiErr.code).toBe(404);
      // The full envelope (including the fax-only serverTime) is on err.body.
      expect(apiErr.body).toMatchObject({
        status: "error",
        error: { code: 404, message: "Not found" },
        serverTime: 1795100000,
      });
    }
  });
});
