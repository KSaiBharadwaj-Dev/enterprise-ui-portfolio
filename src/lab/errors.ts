/* Errors the app understands, and the plain-language message each one maps to. */
import type { Fields } from "./types";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Fields = {},
    readonly retryAfterMs = 0,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
export class NetworkError extends Error {
  constructor() {
    super("Network unreachable");
    this.name = "NetworkError";
  }
}
export class TimeoutError extends Error {
  constructor(readonly ms: number) {
    super(`No response after ${ms} ms`);
    this.name = "TimeoutError";
  }
}

/** What the person sees. Never a stack trace, never a raw server message. */
export function userMessage(error: unknown): string {
  if (error instanceof TimeoutError) return "The server took too long to answer. Try again.";
  if (error instanceof NetworkError)
    return "You appear to be offline. Check your connection and try again.";
  if (error instanceof HttpError) {
    switch (error.status) {
      case 401:
        return "Your session has ended. Sign in again.";
      case 403:
        return "Your role does not allow this action.";
      case 422:
        return "Some fields need attention.";
      case 429:
        return `Too many attempts. Try again in ${Math.ceil(error.retryAfterMs / 1000)} s.`;
      default:
        return error.status >= 500
          ? "The server hit a problem. Nothing was changed."
          : "The request could not be completed.";
    }
  }
  return "Something unexpected went wrong.";
}
