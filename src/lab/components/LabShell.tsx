/* The demo window: tabs, session status, and the panels. */
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "../react";
import { useAuth } from "../auth";
import { userMessage } from "../errors";
import { clock } from "../util";
import { ErrorBoundary } from "./ErrorBoundary";
import { FailuresPanel } from "./FailuresPanel";
import { RiskLog } from "./RiskLog";
import { SessionPanel } from "./SessionPanel";
import { Toasts } from "./Toasts";
import { ValidationPanel } from "./ValidationPanel";

type TabId = "session" | "risks" | "validation" | "failures";
const TAB_LIST: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "session", label: "Session" },
  { id: "risks", label: "Risk log" },
  { id: "validation", label: "Validation" },
  { id: "failures", label: "Failures" },
];

export function LabShell() {
  const { session, secondsLeft, extend, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>("session");
  const [extendError, setExtendError] = useState<string | null>(null);

  const onExtend = (): void => {
    setExtendError(null);
    extend().catch((err: unknown) => setExtendError(userMessage(err)));
  };

  useEffect(() => {
    const onOpen = (e: Event): void => {
      const id = (e as CustomEvent<string>).detail;
      const found = TAB_LIST.find((t) => t.id === id);
      if (found) setTab(found.id);
    };
    window.addEventListener("lab:open", onOpen);
    return () => window.removeEventListener("lab:open", onOpen);
  }, []);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number): void => {
    const to = (
      { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TAB_LIST.length - 1 } as Record<
        string,
        number | undefined
      >
    )[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = TAB_LIST[(to + TAB_LIST.length) % TAB_LIST.length];
    if (next) {
      setTab(next.id);
      document.getElementById(`lab-tab-${next.id}`)?.focus();
    }
  };

  return (
    <div className="lab-window">
      <div className="lab-bar-top">
        <p className="lab-hint">Simulated server. No real requests are made.</p>
        {session ? (
          <p className="lab-pill is-on">
            <span>
              {session.user}, {session.role} role
            </span>{" "}
            <span className="num">{clock(secondsLeft)}</span>{" "}
            <button type="button" className="lab-link" onClick={() => void signOut()}>
              Sign out
            </button>
          </p>
        ) : (
          <p className="lab-pill">Signed out</p>
        )}
      </div>
      {session && secondsLeft <= 15 && (
        <p className="lab-warn" role="alert">
          {/* The alert text stays fixed. The changing number is hidden from screen readers,
              so they hear the warning once, not every second. */}
          <span className="sr-only">Your session is about to end.</span>
          <span aria-hidden="true">Your session ends in {secondsLeft} s.</span>{" "}
          <button type="button" className="lab-link" onClick={onExtend}>
            Extend it
          </button>{" "}
          to stay signed in. {extendError}
        </p>
      )}
      <div role="tablist" aria-label="Lab sections" className="lab-tabs">
        {TAB_LIST.map((t, i) => (
          <button
            key={t.id}
            id={`lab-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`lab-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TAB_LIST.map((t) => (
        <div
          key={t.id}
          id={`lab-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`lab-tab-${t.id}`}
          hidden={tab !== t.id}
          className="lab-panel"
        >
          <ErrorBoundary label={t.label}>
            {t.id === "session" && <SessionPanel />}
            {t.id === "risks" && <RiskLog goToSession={() => setTab("session")} />}
            {t.id === "validation" && <ValidationPanel />}
            {t.id === "failures" && <FailuresPanel />}
          </ErrorBoundary>
        </div>
      ))}
      <Toasts />
    </div>
  );
}
