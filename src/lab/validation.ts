/* Validation shared by the form and the server. The server never trusts the client's own checks. */
import type { Fields, NewRisk, Parsed } from "./types";
import { isSeverity } from "./types";

// name@host.tld: no spaces, no empty parts between dots, and a top-level domain of 2+ characters.
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const MAX_LINK_LENGTH = 200;

export function isHttpsUrl(value: string): boolean {
  // The prefix check rejects "https:example.com", which the URL parser accepts but a browser
  // would resolve as a link on the current site.
  if (!/^https:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    // Allow-list the scheme. "javascript:" and "data:" links never pass.
    return !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Turns untrusted input into a NewRisk, or says exactly which fields are wrong. */
export function parseNewRisk(input: unknown): Parsed<NewRisk> {
  const o: Record<string, unknown> =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const text = (key: string): string =>
    typeof o[key] === "string" ? (o[key] as string).trim() : "";
  const errors: Fields = {};

  const title = text("title");
  if (title.length < 3) errors.title = "Enter at least 3 characters.";
  else if (title.length > 80) errors.title = "Use 80 characters or fewer.";

  const owner = text("owner");
  if (owner.length > 254 || !EMAIL.test(owner))
    errors.owner = "Enter a valid email address, like name@company.com.";

  const severity = text("severity");
  if (!isSeverity(severity)) errors.severity = "Choose low, medium or high.";

  const reference = text("reference");
  if (reference.length > MAX_LINK_LENGTH)
    errors.reference = `Use ${MAX_LINK_LENGTH} characters or fewer.`;
  else if (reference && !isHttpsUrl(reference))
    errors.reference = "Use a full https:// link with no username or password.";

  const description = typeof o.description === "string" ? o.description : "";
  if (description.length > 280) errors.description = "Use 280 characters or fewer.";

  if (Object.keys(errors).length > 0 || !isSeverity(severity)) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      owner: owner.toLowerCase(),
      severity,
      description,
      ...(reference ? { reference } : {}),
    },
  };
}

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "123456789012",
  "qwertyuiopas",
  "letmein12345",
]);
export function passwordChecks(pw: string): ReadonlyArray<{ label: string; ok: boolean }> {
  return [
    { label: "12 or more characters", ok: pw.length >= 12 },
    { label: "Upper and lower case letters", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: "A number", ok: /\d/.test(pw) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(pw) },
    {
      label: "Not a common password",
      ok: pw.length > 0 && !COMMON_PASSWORDS.has(pw.toLowerCase()),
    },
  ];
}
