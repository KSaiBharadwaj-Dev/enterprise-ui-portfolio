/* Failure modes: break the network on purpose and watch the client recover. */
import { useState } from "../react";
import { useAuth } from "../auth";
import { testControls } from "../api";
import type { AttemptLog } from "../api";
import { userMessage } from "../errors";
import { CrashDemo } from "./CrashDemo";

type ScenarioId = "flaky" | "slow" | "down" | "expired";
const SCENARIOS: ReadonlyArray<{ id: ScenarioId; title: string; detail: string }> = [
  {
    id: "flaky",
    title: "Server errors, then recovery",
    detail:
      "The first two attempts return 503. The client waits, retries, and the third attempt succeeds.",
  },
  {
    id: "slow",
    title: "Timeout, then recovery",
    detail: "The first attempt stalls past the 1.5 s limit. The client aborts it and tries again.",
  },
  {
    id: "down",
    title: "Network down",
    detail: "Every attempt fails. The client stops after three tries and shows one plain message.",
  },
  {
    id: "expired",
    title: "Session revoked",
    detail:
      "The server forgets your session. The next request returns 401 and the app signs you out cleanly.",
  },
];

export function FailuresPanel() {
  const { session, request } = useAuth();
  const [running, setRunning] = useState<ScenarioId | null>(null);
  const [log, setLog] = useState<readonly AttemptLog[]>([]);
  const [outcome, setOutcome] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(
    null,
  );

  async function run(id: ScenarioId): Promise<void> {
    setRunning(id);
    setLog([]);
    setOutcome(null);
    const onAttempt = (a: AttemptLog): void => setLog((l) => [...l, a]);
    try {
      if (id === "expired") {
        if (!session) {
          setOutcome({
            kind: "info",
            text: "Sign in on the Session tab first, so there is a session to revoke.",
          });
          return;
        }
        testControls.revokeSessions();
        await request("GET", "/risks", { onAttempt });
      } else {
        testControls.arm(id);
        await request("GET", "/status", { retries: 2, timeoutMs: 1500, onAttempt });
        setOutcome({ kind: "ok", text: "Recovered. The request succeeded after retrying." });
      }
    } catch (err) {
      setOutcome({ kind: "err", text: userMessage(err) });
    } finally {
      testControls.arm("none");
      setRunning(null);
    }
  }

  return (
    <div className="lab-grid">
      <div className="lab-card lab-wide">
        <h3>Break the network</h3>
        <ul className="lab-scenarios">
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{s.title}</strong>
                <p className="lab-hint">{s.detail}</p>
              </div>
              <button
                type="button"
                className="lab-btn lab-btn-small"
                disabled={running !== null}
                onClick={() => void run(s.id)}
              >
                {running === s.id ? "Running..." : "Run"}
              </button>
            </li>
          ))}
        </ul>
        <ol className="lab-log" aria-live="polite">
          {log.map((a) => (
            <li key={a.n} data-outcome={a.outcome}>
              Attempt {a.n}: {a.detail}
            </li>
          ))}
        </ol>
        <p
          className={
            outcome?.kind === "ok" ? "lab-ok" : outcome?.kind === "err" ? "lab-error" : "lab-note"
          }
          role="status"
        >
          {outcome?.text}
        </p>
        <p className="lab-hint">
          Only reads (GET requests) are retried automatically. Writes are not, so a click never
          writes twice.
        </p>
      </div>
      <div className="lab-card">
        <h3>Contain a crash</h3>
        <p className="lab-hint">
          An error boundary isolates a component that throws while rendering.
        </p>
        <CrashDemo />
      </div>
    </div>
  );
}
