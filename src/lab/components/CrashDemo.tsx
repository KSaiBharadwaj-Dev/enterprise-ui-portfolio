/* A component that throws on demand, to show the error boundary containing it. */
import { useState } from "../react";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error("Rendering failed on purpose");
  return <p>This component is healthy.</p>;
}
export function CrashDemo() {
  const [armed, setArmed] = useState(false);
  return (
    <ErrorBoundary label="This component" onReset={() => setArmed(false)}>
      <Bomb armed={armed} />
      <button type="button" className="lab-btn lab-btn-small" onClick={() => setArmed(true)}>
        Crash this component
      </button>
    </ErrorBoundary>
  );
}
