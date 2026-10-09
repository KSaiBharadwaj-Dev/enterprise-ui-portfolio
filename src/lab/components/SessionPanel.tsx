/* Signed-in view: who you are, what you may do, and how long the session has left. */
import { useEffect, useRef, useState } from "../react";
import { useAuth } from "../auth";
import { SESSION_SECONDS } from "../config";
import { userMessage } from "../errors";
import { PERMISSIONS } from "../permissions";
import { clock } from "../util";
import { SignInForm } from "./SignInForm";

export function SessionPanel() {
  const { session, secondsLeft, signOut, extend } = useAuth();
  const [busy, setBusy] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const signedIn = session !== null;

  // Signing in replaces the form that had focus, so move focus to the new content.
  useEffect(() => {
    if (signedIn) panel.current?.focus();
  }, [signedIn]);

  if (!session) return <SignInForm />;
  const pct = Math.min(100, (secondsLeft / SESSION_SECONDS) * 100);

  function onExtend(): void {
    setBusy(true);
    setExtendError(null);
    extend()
      .catch((err: unknown) => setExtendError(userMessage(err)))
      .finally(() => setBusy(false));
  }

  return (
    <div className="lab-session" ref={panel} tabIndex={-1} aria-label="Session details">
      <dl className="lab-dl">
        <div>
          <dt>Signed in as</dt>
          <dd>{session.user}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{session.role}</dd>
        </div>
        <div>
          <dt>Permissions</dt>
          <dd>{PERMISSIONS[session.role].join(", ")}</dd>
        </div>
        <div>
          <dt>Session token</dt>
          <dd>
            <code>
              {session.token.slice(0, 6)}...{session.token.slice(-4)}
            </code>{" "}
            <span className="lab-hint">kept in memory only, gone on reload</span>
          </dd>
        </div>
        <div>
          <dt>Expires in</dt>
          <dd className="num">{clock(secondsLeft)}</dd>
        </div>
      </dl>
      <div className="lab-bar" role="presentation">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="lab-actions">
        <button
          type="button"
          className="lab-btn lab-btn-primary"
          disabled={busy}
          onClick={onExtend}
        >
          Extend session
        </button>
        <button type="button" className="lab-btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
      <p className="lab-error" role="alert">
        {extendError}
      </p>
    </div>
  );
}
