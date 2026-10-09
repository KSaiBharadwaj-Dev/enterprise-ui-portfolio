/* API client: timeout, retry with backoff, and typed errors. */
import { HttpError, NetworkError, TimeoutError } from "./errors";
import { server } from "./server";
import type { HttpMethod } from "./server";
import { sleep } from "./util";

export interface AttemptLog {
  n: number;
  outcome: "ok" | "failed" | "retrying";
  detail: string;
}
export interface RequestOptions {
  body?: unknown;
  token?: string;
  retries?: number;
  timeoutMs?: number;
  simulateFailure?: boolean;
  onAttempt?: (attempt: AttemptLog) => void;
}

/** Only a failure that says nothing about the request itself is worth another try. */
const retryable = (e: unknown): boolean =>
  e instanceof NetworkError ||
  e instanceof TimeoutError ||
  (e instanceof HttpError && e.status >= 500);
const backoff = (attempt: number): number => 300 * 2 ** attempt + Math.round(Math.random() * 100);
const describe = (e: unknown): string =>
  e instanceof HttpError
    ? `HTTP ${e.status}`
    : e instanceof TimeoutError
      ? `timed out after ${e.ms} ms`
      : e instanceof NetworkError
        ? "network unreachable"
        : "unexpected error";

export async function api<T>(
  method: HttpMethod,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { retries = 0, timeoutMs = 4000, onAttempt, ...rest } = opts;
  // Only reads are repeated. Repeating a POST or PATCH could write the same change twice.
  const maxRetries = method === "GET" ? retries : 0;
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const result = (await server.handle({ method, path, ...rest }, controller.signal)) as T;
      onAttempt?.({ n: attempt + 1, outcome: "ok", detail: "succeeded" });
      return result;
    } catch (err) {
      const error: unknown =
        timedOut && err instanceof DOMException ? new TimeoutError(timeoutMs) : err;
      if (attempt >= maxRetries || !retryable(error)) {
        onAttempt?.({ n: attempt + 1, outcome: "failed", detail: `${describe(error)}, giving up` });
        throw error;
      }
      const wait = backoff(attempt);
      onAttempt?.({
        n: attempt + 1,
        outcome: "retrying",
        detail: `${describe(error)}, retrying in ${wait} ms`,
      });
      await sleep(wait);
    } finally {
      window.clearTimeout(timer);
    }
  }
}

/** Test controls for the Failures tab. They are not part of the API a real client would have. */
export const testControls = { arm: server.arm, revokeSessions: server.revokeSessions };
