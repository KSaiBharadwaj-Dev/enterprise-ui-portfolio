/* Password strength: the checklist, the meter and the label all come from one list of rules. */
import { useId, useState } from "../react";
import { passwordChecks } from "../validation";

export function PasswordMeter() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const id = useId();
  const checks = passwordChecks(pw);
  const score = checks.filter((c) => c.ok).length;
  const label = pw === "" ? "Not entered" : score <= 2 ? "Weak" : score < 5 ? "Fair" : "Strong";
  return (
    <div className="lab-card">
      <h3>Password strength</h3>
      <div className="lab-field">
        <label htmlFor={id}>New password</label>
        <div className="lab-inline">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            maxLength={200}
            aria-describedby={`${id}-rules`}
          />
          <button
            type="button"
            className="lab-btn lab-btn-small"
            onClick={() => setShow((s) => !s)}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div
        className="lab-meter"
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={score}
        aria-valuetext={label}
        data-level={label.toLowerCase().replace(" ", "-")}
      >
        <span style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <p className="lab-hint" aria-live="polite">
        Strength: {label}
      </p>
      <ul id={`${id}-rules`} className="lab-rules">
        {checks.map((c) => (
          <li key={c.label} data-ok={c.ok}>
            <span className="sr-only">{c.ok ? "Met: " : "Not met: "}</span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
