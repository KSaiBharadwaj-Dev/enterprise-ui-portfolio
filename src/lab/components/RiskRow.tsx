/* One table row. Memoized, so the list does not re-render rows whose data has not changed. */
import { memo } from "../react";
import { isHttpsUrl } from "../validation";
import type { Risk, RiskStatus } from "../types";

interface RowProps {
  risk: Risk;
  canUpdate: boolean;
  pending: boolean;
  onStatus: (id: string, status: RiskStatus) => void;
}
export const RiskRow = memo(function RiskRow({ risk, canUpdate, pending, onStatus }: RowProps) {
  const next: RiskStatus = risk.status === "resolved" ? "open" : "resolved";
  const action = risk.status === "resolved" ? "Reopen" : "Resolve";
  return (
    <tr className={pending ? "is-pending" : undefined} aria-busy={pending}>
      <td data-label="ID">{risk.id}</td>
      <td data-label="Risk">
        {risk.title}
        {/* Checked again on the way out, not only on the way in. */}
        {risk.reference && isHttpsUrl(risk.reference) && (
          <>
            {" "}
            <a href={risk.reference} target="_blank" rel="noopener noreferrer">
              Reference
            </a>
          </>
        )}
        {/* React escapes this text, so a description can never become markup. */}
        {risk.description && <span className="lab-desc">{risk.description}</span>}
      </td>
      <td data-label="Owner">{risk.owner}</td>
      <td data-label="Severity">
        <span className={`lab-badge sev-${risk.severity}`}>{risk.severity}</span>
      </td>
      <td data-label="Status">
        <span className={`lab-badge st-${risk.status}`}>{risk.status}</span>
      </td>
      <td data-label="Action">
        <button
          type="button"
          className="lab-btn lab-btn-small"
          disabled={!canUpdate}
          aria-disabled={pending || undefined}
          aria-label={`${action} ${risk.id}`}
          onClick={() => {
            if (!pending) onStatus(risk.id, next); // aria-disabled keeps focus on the button, so the click is ignored here
          }}
        >
          {action}
        </button>
      </td>
    </tr>
  );
});
