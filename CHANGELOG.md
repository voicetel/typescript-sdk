# Changelog

## 2.2.15 — 2026-10-15

Sync with VoiceTel API spec v2.2.15.

### Messaging

- New **messaging health** surface (the same view as the portal Messaging tab).
  The spec defines no response schema for these endpoints, so each method resolves
  to the decoded JSON object as `Record<string, unknown>` rather than a typed
  model; only the request body/query is shaped.
  - `GET /v2.2/messaging/health` → `messaging.health()` — account-wide overview:
    summary counts, campaigns with carrier-review progress, numbers needing
    attention (with fix-it actions), 14 days of delivery counts, and the
    alert-email setting. Updated hourly.
  - `GET /v2.2/messaging/health/alerts` → `messaging.healthAlerts()` — whether new
    messaging problems are emailed to the account.
  - `PUT /v2.2/messaging/health/alerts` → `messaging.setHealthAlerts(enabled)` —
    turn alert emails on or off (at most one digest about every 20 hours).
  - `POST /v2.2/messaging/health/check` → `messaging.healthCheck(number)` — live
    check of one number (in service, messaging enabled, campaign approved, assigned
    by the provider, delivery failures in the last 24h, enablement in progress).
    Limited to 30 checks per hour per account.
  - `GET /v2.2/messaging/health/samples` → `messaging.healthSamples(number)` — up to
    3 recent outbound messages from the number that carriers blocked as spam.

## 2.2.14 — 2026-10-14

Sync with VoiceTel API spec v2.2.14.

### Messaging

- `GET /v2.2/messaging/campaigns` — campaign status items now carry `dca`,
  the carrier (DCA) review progress: `electionComplete` (every carrier has a
  DCA assigned), `electedCarriers` (DCAs assigned so far, null when
  unavailable), and `carriers[]` — the latest per-carrier decision
  (`carrier`, `status` of ACTIVE / REJECTED / SUSPENDED / UNSUSPENDED /
  TERMINATED, `detail`, `updatedAt`). `dca` is null for
  `CAMPAIGN_INVALID_ID`.
- Campaign `status` values documented: `CAMPAIGN_DCA_COMPLETE` (ready:
  carrier review finished, numbers assigned),
  `CAMPAIGN_DCA_COMPLETE_NO_NUMBERS_ASSIGNED`, `CAMPAIGN_PENDING_DCA`
  (registry-active but carrier review unfinished — numbers cannot be enabled
  yet), `CAMPAIGN_DCA_REJECTED` (see `dca.carriers`),
  `CAMPAIGN_<registry status>`, `CAMPAIGN_INVALID_ID`.
- `POST /v2.2/messaging/campaigns` — clarified that `campaignClassName` is
  auto-populated from the campaign registry and `campaignStartDate` defaults
  to today.
