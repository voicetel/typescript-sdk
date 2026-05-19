# 📞 VoiceTel TypeScript SDK

The official TypeScript / JavaScript client for the [VoiceTel REST API](https://voicetel.com/docs/api/v2.2/) — provision numbers, place orders, validate e911, send messages, and manage your account, with end-to-end TypeScript types and zero external dependencies.

![Version](https://img.shields.io/badge/version-2.2.10-blue)
![Node](https://img.shields.io/badge/node-%E2%89%A518-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)
![Typed](https://img.shields.io/badge/typed-strict-blue)

## 📚 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quickstart](#-quickstart)
- [Authentication](#-authentication)
- [Resource Reference](#-resource-reference)
- [Error Handling](#-error-handling)
- [Cancellation and Timeouts](#-cancellation-and-timeouts)
- [Rate Limits](#-rate-limits)
- [Browser Support](#-browser-support)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Contributors](#-contributors)
- [Sponsors](#-sponsors)
- [License](#-license)

## ✨ Features

### 🛡️ Strongly Typed End-to-End
- **TypeScript interfaces** for every one of the 73 API operations — request bodies, response payloads, and entity types.
- **Strict mode-friendly.** Authored against `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` style rules.
- **Autocomplete everywhere.** Your IDE knows the shape of every field — no more guessing what's in `result.data.numbers`.

### ⚡ Modern Runtime
- Built on the standard **`fetch`** API. No `node-fetch`, no `axios`, no third-party HTTP dependency.
- Pure **ESM** with a **CJS fallback** — works with `import` and `require`.
- Runs unchanged in **Node.js 18+**, **Deno**, **Bun**, and modern **browsers**.

### 🔁 Production-Grade Transport
- **Automatic retry** with exponential backoff on 429 / 5xx — honors `Retry-After` headers, capped at 8s.
- **AbortController-aware.** Every method accepts `{ signal }` for cancellation.
- **Per-request timeout** managed by the SDK; falls back to `30000ms`.
- **Bearer auth** managed for you; password→key exchange is one `await client.login()` call.
- **Structured `ApiError`** with typed `kind` so you can `switch err.kind { case "rate_limit": ... }` without parsing HTTP status codes.

### 📞 Complete API Coverage
- **Numbers** — list, get, add, remove, route, translate, CNAM, LIDB, fax, forward, SMS, messaging campaigns, port-out PIN, account moves.
- **Account** — profile, sub-accounts, CDRs, credits, payments, MRC, registration, password recovery.
- **e911** — record provisioning, address validation, lookup, removal.
- **Gateways** — list, create, update, delete, view bound numbers.
- **Messaging** — SMS & MMS sending, message history, 10DLC brand and campaign registration, per-number messaging state.
- **Lookups** — CNAM and LRN dips.
- **iNumbering** — inventory search, coverage queries, number orders, port-in submissions, port-out availability checks.
- **Support** — ticket create / read / update / delete, threaded messages, replies.
- **ACL** — IP allowlist management with structured 409 conflict bodies.
- **Authentication** — switch between Digest, IP-only, or hybrid modes; rotate passwords.

### 🧪 Battle-Tested
- **40 tests** at **96% statement coverage** with `vitest`.
- **Mocked fetch** + every method and error path covered.
- **Strict TypeScript** with `tsc --noEmit` enforced in CI.

### 📦 Clean Distribution
- Zero codegen footprint — every byte hand-written.
- Built with `tsup`; ships ESM + CJS + `.d.ts` declarations in one package.
- **Zero runtime dependencies.**

## 🚀 Installation

```bash
npm install @voicetel/sdk
# or
pnpm add @voicetel/sdk
# or
yarn add @voicetel/sdk
```

Requires Node.js 18 or later (for the global `fetch` API). Browsers and Deno/Bun work without polyfills.

## 🏁 Quickstart

```ts
import { VoiceTelClient } from "@voicetel/sdk";

const client = new VoiceTelClient();

// Exchange username + password for an API key (one-time per session)
await client.login(1000000001, "hunter2");

// Typed responses — your editor knows what `me` is.
const me = await client.account.get();
console.log(`Balance: $${me.cash?.toFixed(2)}  |  Caller ID: ${me.callerId}`);

// List your numbers
const { numbers } = await client.numbers.list();
for (const n of numbers) {
  console.log(`${n.number}  route=${n.route}  cnam=${n.cnam}  sms=${n.smsEnabled}`);
}
```

Or, if you already have an API key:

```ts
const client = new VoiceTelClient({ apiKey: "32hex..." });
const { coverage } = await client.iNumbering.coverage({ state: "NJ" });
for (const bucket of coverage) {
  console.log(`${bucket.npa}-${bucket.nxx}: ${bucket.count} TNs available`);
}
```

## 🔑 Authentication

Every endpoint requires `Authorization: Bearer <apikey>` **except** `POST /v2.2/account/api-key`, which exchanges username + password for a fresh key. `client.login()` handles the exchange and installs the returned key on the transport.

Re-fetch the API key after any password change — the old one is invalidated.

> Don't have credentials yet? Get them at **[voicetel.com/docs/api/v2.2/credentials](https://voicetel.com/docs/api/v2.2/credentials/)**.

```ts
const client = new VoiceTelClient();
const key = await client.login(1000000001, "hunter2");
// `key` is the new 32-hex bearer; the client already has it installed.
```

## 🗺️ Resource Reference

| Resource | Field on Client | Example |
|---|---|---|
| Account | `client.account` | `client.account.cdr({ start, end })` |
| ACL | `client.acl` | `client.acl.add({ acl: [{ cidr: "..." }] })` |
| Authentication | `client.authentication` | `client.authentication.update({ authType: 1 })` |
| e911 | `client.e911` | `client.e911.validate({ address1, ... })` |
| Gateways | `client.gateways` | `client.gateways.list()` |
| iNumbering | `client.iNumbering` | `client.iNumbering.searchInventory({ npa: 201 })` |
| Lookups | `client.lookups` | `client.lookups.lrn("2015551234", "2012548000")` |
| Messaging | `client.messaging` | `client.messaging.send({ fromNumber, toNumber, text })` |
| Numbers | `client.numbers` | `client.numbers.assignCampaign("2015551234", { campaignId })` |
| Support | `client.support` | `client.support.create({ subject, message })` |

All request and response shapes are exported from the package — destructure what you need:

```ts
import {
  VoiceTelClient,
  type MessageSendRequest,
  type PortSubmitRequest,
  type NumberCampaignAssignRequest,
} from "@voicetel/sdk";

const send: MessageSendRequest = {
  fromNumber: "2012548000",
  toNumber: "2015551234",
  text: "Your code is 482917",
};
const sent = await client.messaging.send(send);
console.log(`Sent: ${sent.id}  (${sent.parts} segment(s))`);
```

## 🚨 Error Handling

All HTTP errors throw `ApiError` with a typed `kind`:

| `kind` | HTTP status |
|---|---|
| `"bad_request"` | 400 |
| `"authentication"` | 401 |
| `"permission_denied"` | 403 |
| `"not_found"` | 404 |
| `"conflict"` | 409 |
| `"rate_limit"` | 429 |
| `"server"` | 5xx |
| `"unknown"` | other / transport |

Or use the type guards:

```ts
import { isNotFound, isRateLimit } from "@voicetel/sdk";

try {
  const n = await client.numbers.get("9999999999");
} catch (err) {
  if (isNotFound(err)) {
    console.log("That number isn't on your account.");
  } else if (isRateLimit(err)) {
    console.log("Slow down — backoff and retry.");
  } else {
    throw err;
  }
}
```

For 409 conflicts on ACL or auth, the structured failure payload is on `err.body`:

```ts
import { ApiError, isConflict, type AclConflictData } from "@voicetel/sdk";

try {
  await client.acl.add({ acl: [{ cidr: "abc" }] });
} catch (err) {
  if (isConflict(err)) {
    const body = err.body as AclConflictData;
    console.log("Failed CIDRs:", body.failed);
  }
}
```

## ⏱️ Cancellation and Timeouts

Every method accepts `{ signal }` for `AbortController`-based cancellation:

```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), 1000);
const me = await client.account.get({ signal: ac.signal });
```

Or set a per-client default timeout:

```ts
const client = new VoiceTelClient({
  apiKey: "...",
  timeoutMs: 5000,
});
```

## ⏱️ Rate Limits

These endpoints are limited to **6 requests per hour per IP**:

- `account/info`
- `account/mrc` (`client.account.recurringCharges()`)
- `account/cdr` (`client.account.cdr()`)
- `account/api-key` (`client.login()`)

The SDK automatically retries 429 responses with `Retry-After` honored, up to `maxRetries` (default 2). To bump it:

```ts
const client = new VoiceTelClient({
  apiKey,
  maxRetries: 4,
  timeoutMs: 60_000,
});
```

## 🌐 Browser Support

The SDK runs unchanged in modern browsers — it depends only on `fetch`, `URL`, `URLSearchParams`, and `AbortController`. No `process`, no Node-specific imports.

CORS is your responsibility: the VoiceTel API doesn't currently set permissive CORS headers, so direct browser usage typically requires a backend proxy or your own CORS-friendly wrapper.

## 🛠️ Development

```bash
git clone https://github.com/voicetel/typescript-sdk
cd typescript-sdk
npm install

# Type check
npm run typecheck

# Lint
npm run lint

# Tests
npm test

# Tests with coverage
npm run test:cov

# Build
npm run build
```

## 📖 API Documentation

- **Reference docs:** [voicetel.com/docs/api/v2.2/](https://voicetel.com/docs/api/v2.2/)
- **Interactive playground:** [voicetel.com/docs/api/v2.2/playground/](https://voicetel.com/docs/api/v2.2/playground/) — try the API in your browser without writing any code
- **API credentials:** [voicetel.com/docs/api/v2.2/credentials/](https://voicetel.com/docs/api/v2.2/credentials/)

## 🙌 Contributors

- [Michael Mavroudis](https://github.com/mavroudis) — Lead Developer

Contributions welcome. Open an issue describing the change, or send a pull request against `main`.

## 💖 Sponsors

| Sponsor | Contribution |
|---------|--------------|
| [VoiceTel Communications](https://voicetel.com) | Primary development and production hosting |

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
