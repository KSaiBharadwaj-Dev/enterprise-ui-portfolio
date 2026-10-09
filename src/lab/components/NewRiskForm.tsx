/* New risk form: validates on blur and on submit, focuses the first problem,
   and shows server errors on the fields. */
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "../react";
import { useAuth } from "../auth";
import { HttpError, userMessage } from "../errors";
import { useStore } from "../store";
import { SEVERITIES } from "../types";
import type { Fields } from "../types";
import { parseNewRisk } from "../validation";
import { Field } from "./Field";

interface FormValues {
  title: string;
  owner: string;
  severity: string;
  reference: string;
  description: string;
}
type FieldName = keyof FormValues;
const EMPTY: FormValues = {
  title: "",
  owner: "",
  severity: "medium",
  reference: "",
  description: "",
};
const FIELD_ORDER: readonly FieldName[] = [
  "title",
  "owner",
  "severity",
  "reference",
  "description",
];

export function NewRiskForm() {
  const { session, request } = useAuth();
  const { create } = useStore();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Fields>({});
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [forged, setForged] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<FieldName | null>(null);
  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});

  const parsed = useMemo(() => parseNewRisk(values), [values]);
  const clientErrors: Fields = parsed.ok ? {} : parsed.errors;
  const errorFor = (f: FieldName): string | undefined =>
    (touched[f] || submitted ? clientErrors[f] : undefined) ?? serverErrors[f];

  const change =
    (f: FieldName) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setValues((v) => ({ ...v, [f]: e.target.value }));
      setServerErrors((s) => {
        const { [f]: _gone, ...rest } = s;
        return rest;
      });
    };
  const blur = (f: FieldName) => (): void => setTouched((t) => ({ ...t, [f]: true }));
  // Focus moves in an effect, after React has drawn aria-invalid and the error text,
  // so a screen reader reads the problem as it lands on the field.
  useEffect(() => {
    if (focusField === null) return;
    refs.current[focusField]?.focus();
    setFocusField(null);
  }, [focusField]);
  const focusFirst = (errors: Fields): void => {
    setFocusField(FIELD_ORDER.find((f) => errors[f]) ?? null); // send people straight to the problem
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitted(true);
    setBanner(null);
    if (!parsed.ok) {
      focusFirst(parsed.errors);
      const count = Object.keys(parsed.errors).length;
      setBanner({
        kind: "err",
        text: `Fix ${count} ${count === 1 ? "field" : "fields"} and try again.`,
      });
      return;
    }
    if (!session) {
      setBanner({
        kind: "err",
        text: "Sign in first. The server rejects requests that have no session.",
      });
      return;
    }
    setPending(true);
    try {
      const risk = await create(parsed.value);
      setValues(EMPTY);
      setTouched({});
      setSubmitted(false);
      setBanner({ kind: "ok", text: `${risk.id} created. It is now in the Risk log.` });
    } catch (err) {
      if (err instanceof HttpError && err.status === 422) {
        setServerErrors(err.fields);
        focusFirst(err.fields);
      }
      setBanner({ kind: "err", text: userMessage(err) });
    } finally {
      setPending(false);
    }
  }

  async function forge(): Promise<void> {
    try {
      await request("POST", "/risks", {
        body: {
          title: "x",
          owner: "not-an-email",
          severity: "critical",
          reference: "javascript:alert(1)",
        },
      });
      setForged("The server accepted it.");
    } catch (err) {
      setForged(
        err instanceof HttpError && err.status === 422
          ? `HTTP 422\n${Object.entries(err.fields)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")}`
          : userMessage(err),
      );
    }
  }

  return (
    <div className="lab-card">
      <h3>New risk</h3>
      <form className="lab-form" onSubmit={(e) => void onSubmit(e)} noValidate>
        {/* maxLength is looser than the 80-character rule on purpose, so the rule's message can be seen. */}
        <Field label="Title" error={errorFor("title")}>
          {(a) => (
            <input
              id={a.id}
              ref={(el) => {
                refs.current.title = el;
              }}
              value={values.title}
              onChange={change("title")}
              onBlur={blur("title")}
              aria-invalid={a.invalid}
              aria-describedby={a.describedBy}
              maxLength={120}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Owner email" error={errorFor("owner")}>
          {(a) => (
            <input
              id={a.id}
              ref={(el) => {
                refs.current.owner = el;
              }}
              type="email"
              value={values.owner}
              onChange={change("owner")}
              onBlur={blur("owner")}
              aria-invalid={a.invalid}
              aria-describedby={a.describedBy}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Severity" error={errorFor("severity")}>
          {(a) => (
            <select
              id={a.id}
              ref={(el) => {
                refs.current.severity = el;
              }}
              value={values.severity}
              onChange={change("severity")}
              onBlur={blur("severity")}
              aria-invalid={a.invalid}
              aria-describedby={a.describedBy}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label="Reference link (optional)"
          hint="https only. Links starting with javascript: or data: are refused."
          error={errorFor("reference")}
        >
          {(a) => (
            <input
              id={a.id}
              ref={(el) => {
                refs.current.reference = el;
              }}
              value={values.reference}
              onChange={change("reference")}
              onBlur={blur("reference")}
              aria-invalid={a.invalid}
              aria-describedby={a.describedBy}
              inputMode="url"
              autoComplete="off"
            />
          )}
        </Field>
        <Field
          label="Description (optional)"
          hint={`${values.description.length} of 280 characters`}
          error={errorFor("description")}
        >
          {(a) => (
            <textarea
              id={a.id}
              ref={(el) => {
                refs.current.description = el;
              }}
              value={values.description}
              onChange={change("description")}
              onBlur={blur("description")}
              aria-invalid={a.invalid}
              aria-describedby={a.describedBy}
              rows={3}
            />
          )}
        </Field>
        <div className="lab-actions">
          <button type="submit" className="lab-btn lab-btn-primary" disabled={pending}>
            {pending ? "Creating..." : "Create risk"}
          </button>
        </div>
        <p className={banner?.kind === "ok" ? "lab-ok" : "lab-error"} role="alert">
          {banner?.text}
        </p>
      </form>
      <div className="lab-forge">
        <p className="lab-hint">
          Client checks are for convenience. The server checks everything again, so skip the form
          and send bad data straight to it:
        </p>
        <button type="button" className="lab-btn lab-btn-small" onClick={() => void forge()}>
          Send a forged request
        </button>
        <div aria-live="polite">{forged && <pre className="lab-pre">{forged}</pre>}</div>
      </div>
    </div>
  );
}
