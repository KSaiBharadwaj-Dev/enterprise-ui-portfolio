/* A simulated server. It stands in for the network, so the sign-in, permission, validation, retry and
   rollback logic around it is real application code with no real requests behind it. */
import { SESSION_SECONDS, LOCKOUT_MS, MAX_ATTEMPTS } from "./config";
import { HttpError, NetworkError } from "./errors";
import { can } from "./permissions";
import type { Permission } from "./permissions";
import type { Risk, RiskStatus, Role, Session, Severity } from "./types";
import { isStatus } from "./types";
import { constantTimeEqual, randomToken, sleep } from "./util";
import { parseNewRisk } from "./validation";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type Chaos = "none" | "flaky" | "slow" | "down";
interface ApiRequest {
  method: HttpMethod;
  path: string;
  body?: unknown;
  token?: string;
  simulateFailure?: boolean;
}

const USERS: Readonly<Record<string, { password: string; role: Role }>> = {
  analyst: { password: "Analyst#2026", role: "viewer" },
  lead: { password: "Lead#2026", role: "admin" },
};

function seedRisks(): Risk[] {
  const rows: ReadonlyArray<readonly [string, Severity, RiskStatus, string]> = [
    ["Legacy platform cutover window slips", "high", "open", "alex.rivera"],
    ["Month-end journal reconciliation breaks", "high", "mitigating", "sam.okafor"],
    ["UAT sign-off delayed by SME availability", "medium", "open", "priya.nair"],
    ["Vendor change request backlog grows", "medium", "mitigating", "jordan.lee"],
    ["Migrated balances not yet verified", "high", "open", "alex.rivera"],
    ["Hypercare staffing gap after go-live", "low", "open", "taylor.kim"],
    ["Report mapping differs from source", "medium", "resolved", "sam.okafor"],
    ["Access review not scheduled before audit", "low", "resolved", "priya.nair"],
  ];
  return rows.map(([title, severity, status, who], i) => ({
    id: `R-${101 + i}`,
    title,
    severity,
    status,
    owner: `${who}@example.com`,
  }));
}

export const server = (() => {
  const sessions = new Map<string, Session>();
  const attempts = new Map<string, { count: number; lockedUntil: number }>();
  const risks: Risk[] = seedRisks();
  let nextId = 109;
  const chaos = { mode: "none" as Chaos, flakyLeft: 0, slowLeft: 0 };

  function authenticate(token: string | undefined): Session {
    const session = token ? sessions.get(token) : undefined;
    if (!session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      throw new HttpError(401, "Not signed in");
    }
    return session;
  }
  function require(session: Session, permission: Permission): void {
    if (!can(session.role, permission)) throw new HttpError(403, "Forbidden"); // enforced here, not only in the UI
  }

  function login(body: unknown): Session {
    const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const username =
      typeof o.username === "string" ? o.username.trim().toLowerCase().slice(0, 40) : "";
    const password = typeof o.password === "string" ? o.password.slice(0, 200) : "";
    const now = Date.now();
    let record = attempts.get(username) ?? { count: 0, lockedUntil: 0 };
    if (record.lockedUntil > now)
      throw new HttpError(429, "Too many attempts", {}, record.lockedUntil - now);
    if (record.lockedUntil !== 0) record = { count: 0, lockedUntil: 0 };

    // Object.hasOwn stops names like "constructor" from matching inherited properties.
    const user = Object.hasOwn(USERS, username) ? USERS[username] : undefined;
    // A real server stores a salted hash (argon2 or bcrypt).
    // Compare even for unknown users, so timing does not reveal which names exist.
    const matches = constantTimeEqual(password, user?.password ?? "x".repeat(12));
    if (!user || !matches) {
      const count = record.count + 1;
      const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
      attempts.set(username, { count, lockedUntil });
      if (lockedUntil) throw new HttpError(429, "Too many attempts", {}, LOCKOUT_MS);
      throw new HttpError(401, "Invalid credentials"); // same answer for a wrong name and a wrong password
    }
    attempts.delete(username);
    const session: Session = {
      token: randomToken(),
      user: username,
      role: user.role,
      expiresAt: now + SESSION_SECONDS * 1000,
    };
    sessions.set(session.token, session);
    return { ...session };
  }

  async function status(signal: AbortSignal): Promise<unknown> {
    switch (chaos.mode) {
      case "down":
        throw new NetworkError();
      case "flaky":
        if (chaos.flakyLeft > 0) {
          chaos.flakyLeft--;
          throw new HttpError(503, "Service unavailable");
        }
        break;
      case "slow":
        if (chaos.slowLeft > 0) {
          chaos.slowLeft--;
          await sleep(6000, signal);
        }
        break;
      case "none":
        break;
    }
    return { ok: true, servedAt: new Date().toISOString() };
  }

  async function handle(req: ApiRequest, signal: AbortSignal): Promise<unknown> {
    await sleep(200 + Math.random() * 250, signal); // simulated latency
    const { method, path } = req;
    if (method === "GET" && path === "/status") return status(signal);
    if (method === "POST" && path === "/session") return login(req.body);

    const session = authenticate(req.token); // everything below needs a live session
    if (method === "DELETE" && path === "/session") {
      sessions.delete(session.token);
      return { ok: true };
    }
    if (method === "POST" && path === "/session/refresh") {
      const renewed: Session = { ...session, expiresAt: Date.now() + SESSION_SECONDS * 1000 };
      sessions.set(renewed.token, renewed);
      return { ...renewed };
    }
    if (method === "GET" && path === "/risks") {
      require(session, "risk:read");
      return risks.map((r) => ({ ...r }));
    }
    if (method === "POST" && path === "/risks") {
      require(session, "risk:create");
      const parsed = parseNewRisk(req.body); // never trust the client's own validation
      if (!parsed.ok) throw new HttpError(422, "Validation failed", parsed.errors);
      const { title, owner, severity, reference, description } = parsed.value;
      const risk: Risk = {
        id: `R-${nextId++}`,
        title,
        owner,
        severity,
        status: "open",
        ...(reference ? { reference } : {}),
        ...(description ? { description } : {}),
      };
      risks.push(risk);
      return { ...risk };
    }
    const match = /^\/risks\/(R-\d+)$/.exec(path);
    if (method === "PATCH" && match?.[1]) {
      require(session, "risk:update");
      const body =
        typeof req.body === "object" && req.body !== null
          ? (req.body as Record<string, unknown>)
          : {};
      if (!isStatus(body.status))
        throw new HttpError(422, "Validation failed", {
          status: "Choose open, mitigating or resolved.",
        });
      if (req.simulateFailure) throw new HttpError(500, "Update failed");
      const target = risks.find((r) => r.id === match[1]);
      if (!target) throw new HttpError(404, "Not found");
      target.status = body.status;
      return { ...target };
    }
    throw new HttpError(404, "Not found");
  }

  return {
    handle,
    arm(mode: Chaos): void {
      chaos.mode = mode;
      chaos.flakyLeft = mode === "flaky" ? 2 : 0;
      chaos.slowLeft = mode === "slow" ? 1 : 0;
    },
    revokeSessions(): void {
      sessions.clear();
    },
  };
})();
