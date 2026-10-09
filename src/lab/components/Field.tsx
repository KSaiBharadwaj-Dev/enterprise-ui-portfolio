/* A form field that wires its label, hint and error together for assistive technology. */
import type { ReactNode } from "react";
import { useId } from "../react";

interface FieldProps {
  label: string;
  hint?: string;
  error: string | undefined;
  children: (a: { id: string; invalid: boolean; describedBy: string | undefined }) => ReactNode;
}
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy =
    [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="lab-field">
      <label htmlFor={id}>{label}</label>
      {children({ id, invalid: Boolean(error), describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="lab-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="lab-error">
          {error}
        </p>
      )}
    </div>
  );
}
