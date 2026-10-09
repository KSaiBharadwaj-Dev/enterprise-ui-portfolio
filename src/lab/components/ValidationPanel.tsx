/* The Validation tab: the form, the password meter and the sanitizer side by side. */
import { NewRiskForm } from "./NewRiskForm";
import { PasswordMeter } from "./PasswordMeter";
import { SanitizerDemo } from "./SanitizerDemo";

export function ValidationPanel() {
  return (
    <div className="lab-grid">
      <NewRiskForm />
      <PasswordMeter />
      <SanitizerDemo />
    </div>
  );
}
