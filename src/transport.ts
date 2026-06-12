import { randomUUID } from "node:crypto";

import { ApiError, kindFromStatus, type ApiErrorOptions } from "./errors.js";
import { DEFAULT_BASE_URL, DEFAULT_USER_AGENT } from "./version.js";

/** Construction-time configuration for {@link VoiceTelClient}. */
export interface ClientOptions {
  /** Existing bearer token. If omitted, you must call {@link VoiceTelClient.login}. */
  apiKey?: string;
  /** Base URL override. Defaults to `https://api.voicetel.com`. */
  baseUrl?: string;
  /** Timeout per request, in milliseconds. Defaults to 30 000. */
  timeoutMs?: number;
  /** How many times to retry 429/5xx responses. Defaults to 2 (total attempts = N+1). */
  maxRetries?: number;
  /** Inject a custom `fetch` (e.g., `undici.fetch`). Defaults to the global `fetch`. */
  fetch?: typeof globalThis.fetch;
  /** Override the User-Agent header. */
  userAgent?: string;
}

/** @internal — request-shape used by the resource services. */
export interface RequestSpec {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  requireAuth?: boolean;
  signal?: AbortSignal;
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

function stripTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return end === s.length ? s : s.slice(0, end);
}

/**
 * @internal — handles auth, retry, JSON encode/decode, and error mapping.
 *
 * The transport is unexported; callers configure it indirectly through
 * {@link VoiceTelClient} construction options.
 */
export class Transport {
  private apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly userAgent: string;

  constructor(opts: ClientOptions = {}) {
    this.apiKey = opts.apiKey ?? "";
    this.baseUrl = stripTrailingSlashes(opts.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxRetries = opts.maxRetries ?? 2;
    if (this.maxRetries < 0) {
      throw new ApiError("maxRetries must be >= 0", { kind: "unknown" });
    }
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    if (typeof this.fetchImpl !== "function") {
      throw new ApiError("No fetch implementation available — pass `fetch` explicitly.", {
        kind: "unknown",
      });
    }
    this.userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  }

  /** @internal — install a freshly-exchanged bearer token. */
  setBearer(key: string): void {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(spec: RequestSpec): Promise<T> {
    const requireAuth = spec.requireAuth !== false;
    if (requireAuth && !this.apiKey) {
      throw new ApiError(
        "no api key set; pass `apiKey` to new VoiceTelClient(...) or call client.login()",
        { kind: "authentication" },
      );
    }

    let url = this.baseUrl + spec.path;
    if (spec.query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(spec.query)) {
        if (v !== undefined && v !== null) {
          params.set(k, String(v));
        }
      }
      const q = params.toString();
      if (q) url += `?${q}`;
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "User-Agent": this.userAgent,
    };
    if (requireAuth) headers["Authorization"] = `Bearer ${this.apiKey}`;
    if (["POST", "PUT", "PATCH"].includes(spec.method)) {
      headers["Idempotency-Key"] = randomUUID();
    }
    let bodyText: string | undefined;
    if (spec.body !== undefined) {
      bodyText = JSON.stringify(spec.body);
      headers["Content-Type"] = "application/json";
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ac = new AbortController();
      const linked = link(ac, spec.signal);
      const timer = setTimeout(() => ac.abort(new Error("request timeout")), this.timeoutMs);

      let response: Response | undefined;
      try {
        response = await this.fetchImpl(url, {
          method: spec.method,
          headers,
          body: bodyText,
          signal: ac.signal,
        });
      } catch (err) {
        lastError = err;
        if (spec.signal?.aborted) {
          throw new ApiError("request cancelled", { cause: err });
        }
        if (attempt >= this.maxRetries) {
          throw new ApiError(
            `transport error after ${attempt + 1} attempt(s): ${describe(err)}`,
            { cause: err },
          );
        }
        await sleep(backoffDelay(attempt, null), spec.signal);
        continue;
      } finally {
        clearTimeout(timer);
        linked();
      }

      if (RETRYABLE.has(response.status) && attempt < this.maxRetries) {
        const delay = backoffDelay(attempt, response);
        // Drain the body so the underlying connection can be reused.
        try {
          await response.text();
        } catch {
          /* ignore */
        }
        await sleep(delay, spec.signal);
        continue;
      }
      return decode<T>(response);
    }

    // Defensive — the loop above always returns or throws.
    throw new ApiError("retry loop exhausted", { cause: lastError });
  }
}

/** @internal */
async function decode<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (response.status >= 200 && response.status < 300) {
    if (text.length === 0) return undefined as T;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new ApiError(`non-JSON success response: ${text.slice(0, 200)}`, {
        statusCode: response.status,
        body: text,
        cause: err,
      });
    }
    return unwrap(parsed) as T;
  }

  let body: unknown = text;
  let code: string | undefined;
  let message = `HTTP ${response.status}`;
  try {
    const parsed = JSON.parse(text);
    body = parsed;
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const c = obj["code"] ?? obj["error"];
      if (typeof c === "string") code = c;
      const m = obj["message"] ?? obj["error"];
      if (typeof m === "string") message = m;
    }
  } catch {
    /* leave body as text */
  }

  const opts: ApiErrorOptions = { statusCode: response.status, body, kind: kindFromStatus(response.status) };
  if (code !== undefined) opts.code = code;
  throw new ApiError(message, opts);
}

/** @internal — strip the `{status, data}` envelope if present; otherwise return as-is. */
function unwrap(body: unknown): unknown {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "status" in (body as Record<string, unknown>) &&
    "data" in (body as Record<string, unknown>)
  ) {
    return (body as { data: unknown }).data;
  }
  return body;
}

/** @internal */
function backoffDelay(attempt: number, response: Response | null): number {
  if (response) {
    const header = response.headers.get("Retry-After");
    if (header) {
      const secs = Number(header);
      if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
    }
  }
  return Math.min(8000, 500 * 2 ** attempt);
}

/** @internal — abortable sleep. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(t);
      reject(new ApiError("aborted during retry backoff"));
    };
    if (signal) {
      if (signal.aborted) {
        clearTimeout(t);
        reject(new ApiError("aborted during retry backoff"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/** @internal — chain the user's signal into our local AbortController. */
function link(local: AbortController, parent?: AbortSignal): () => void {
  if (!parent) return () => {};
  if (parent.aborted) {
    local.abort(parent.reason);
    return () => {};
  }
  const onAbort = (): void => local.abort(parent.reason);
  parent.addEventListener("abort", onAbort);
  return () => parent.removeEventListener("abort", onAbort);
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
