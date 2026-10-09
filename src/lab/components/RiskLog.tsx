/* Risk log: state, permissions and a table that becomes cards in a narrow container. */
import { useCallback, useMemo, useState } from "../react";
import { useAuth } from "../auth";
import { HttpError, userMessage } from "../errors";
import { can } from "../permissions";
import { selectVisible } from "../state";
import type { SortKey, State } from "../state";
import { useStore } from "../store";
import { STATUSES } from "../types";
import type { RiskStatus } from "../types";
import { RiskRow } from "./RiskRow";

const COLUMNS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "id", label: "ID" },
  { key: "title", label: "Risk" },
  { key: "owner", label: "Owner" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
];

export function RiskLog({ goToSession }: { goToSession: () => void }) {
  const { session, request } = useAuth();
  const { state, dispatch, reload, setStatus } = useStore();
  const visible = useMemo(() => selectVisible(state), [state]);
  const onStatus = useCallback(
    (id: string, status: RiskStatus) => void setStatus(id, status),
    [setStatus],
  );
  const [bypass, setBypass] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="lab-empty">
        <p>The risk log needs a session. Sign in first, then come back.</p>
        <button type="button" className="lab-btn lab-btn-primary" onClick={goToSession}>
          Go to sign in
        </button>
      </div>
    );
  }
  const canUpdate = can(session.role, "risk:update");

  async function sendAnyway(): Promise<void> {
    try {
      await request("PATCH", "/risks/R-101", { body: { status: "resolved" } });
      setBypass("The server accepted it.");
    } catch (err) {
      setBypass(
        `Server answered ${err instanceof HttpError ? err.status : "an error"}: ${userMessage(err)}`,
      );
    }
  }

  return (
    <div className="lab-risks">
      <div className="lab-toolbar">
        <input
          type="search"
          aria-label="Search risks"
          placeholder="Search risks"
          value={state.query}
          onChange={(e) => dispatch({ type: "query", value: e.target.value })}
        />
        <select
          aria-label="Filter by status"
          value={state.status}
          onChange={(e) => dispatch({ type: "filter", value: e.target.value as State["status"] })}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="lab-btn lab-btn-small"
          onClick={() => void reload()}
          disabled={state.load === "loading"}
        >
          Reload
        </button>
        {canUpdate ? (
          <label className="lab-check">
            <input
              type="checkbox"
              checked={state.failUpdates}
              onChange={(e) => dispatch({ type: "chaos/updates", on: e.target.checked })}
            />
            Make updates fail
          </label>
        ) : (
          <button type="button" className="lab-btn lab-btn-small" onClick={() => void sendAnyway()}>
            Send an update anyway
          </button>
        )}
      </div>
      {!canUpdate && (
        <p className="lab-note" role="status">
          You are signed in as a viewer, so the buttons are off.{" "}
          {bypass ?? "Press the button above to skip the UI and ask the server directly."}
        </p>
      )}
      <p className="lab-hint" role="status">
        {state.load === "loading" ? "Loading risks..." : ""}
      </p>
      <p className="lab-error" role="alert">
        {state.load === "error" && (
          <>
            {state.error}{" "}
            <button type="button" className="lab-btn lab-btn-small" onClick={() => void reload()}>
              Retry
            </button>
          </>
        )}
      </p>
      <p className="lab-hint">
        Drag the bottom-right corner of the table to resize it. Below 40rem it turns into cards.
      </p>
      <div className="lab-resize">
        <table className="lab-table">
          <caption className="sr-only">Program risks</caption>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    state.sort.key === c.key
                      ? state.sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button type="button" onClick={() => dispatch({ type: "sort", key: c.key })}>
                    {c.label}
                  </button>
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((risk) => (
              <RiskRow
                key={risk.id}
                risk={risk}
                canUpdate={canUpdate}
                pending={state.pending.includes(risk.id)}
                onStatus={onStatus}
              />
            ))}
            {visible.length === 0 && state.load === "ready" && (
              <tr>
                <td colSpan={6} className="lab-none">
                  No risks match. Clear the search or change the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <details className="lab-state">
        <summary>Live state</summary>
        <pre>
          {JSON.stringify(
            {
              load: state.load,
              query: state.query,
              status: state.status,
              sort: state.sort,
              pending: state.pending,
              failUpdates: state.failUpdates,
              rows: `${visible.length} of ${state.items.length}`,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
