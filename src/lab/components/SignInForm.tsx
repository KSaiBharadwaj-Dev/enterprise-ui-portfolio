/* Sign-in form: validation, lockout countdown, and generic error messages. */
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "../react";
import { useAuth } from "../auth";
import { HttpError, userMessage } from "../errors";
import { useNow } from "../hooks/useNow";
import { Field } from "./Field";

export function SignInForm() {
  const { signIn, notice } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const now = useNow(lockedUntil > Date.now() ? 250 : null);
  const lockLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  // After a sign-out or an expiry this form replaces the signed-in view, so put focus on the first field.
  useEffect(() => {
    if (notice) userRef.current?.focus();
  }, []); // on mount only, so typing never pulls focus back

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      (username.trim() ? passRef : userRef).current?.focus();
      return;
    }
    setPending(true);
    setError(null);
    try {
      await signIn(username.trim(), password);
    } catch (err) {
      setPassword(""); // never leave a rejected password sitting in the field
      if (err instanceof HttpError && err.status === 429)
        setLockedUntil(Date.now() + err.retryAfterMs);
      setError(
        err instanceof HttpError && err.status === 401
          ? "Invalid username or password."
          : userMessage(err),
      );
      passRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="lab-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <p className="lab-note" role="status">
        {notice}
      </p>
      <Field label="Username" error={undefined}>
        {(a) => (
          <input
            id={a.id}
            ref={userRef}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
          />
        )}
      </Field>
      <Field label="Password" error={undefined}>
        {(a) => (
          <input
            id={a.id}
            ref={passRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={200}
          />
        )}
      </Field>
      <div className="lab-actions">
        <button
          type="submit"
          className="lab-btn lab-btn-primary"
          disabled={pending || lockLeft > 0}
        >
          {pending ? "Signing in..." : lockLeft > 0 ? `Locked for ${lockLeft} s` : "Sign in"}
        </button>
        <span className="lab-hint">Demo accounts, made up for this page:</span>
        <button
          type="button"
          className="lab-btn lab-btn-small"
          onClick={() => {
            setUsername("analyst");
            setPassword("Analyst#2026");
          }}
        >
          Use the viewer account
        </button>
        <button
          type="button"
          className="lab-btn lab-btn-small"
          onClick={() => {
            setUsername("lead");
            setPassword("Lead#2026");
          }}
        >
          Use the admin account
        </button>
      </div>
      <p className="lab-error" role="alert">
        {error}
      </p>
      <p className="lab-hint">
        Try a wrong password three times to see the lockout. The server gives the same answer for a
        wrong name and a wrong password.
      </p>
    </form>
  );
}
