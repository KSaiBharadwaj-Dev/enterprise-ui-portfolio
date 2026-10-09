/* Entry point. Providers wrap the shell, and an error boundary sits outside all of them. */
import type { ReactNode } from "react";
import { AuthProvider } from "./auth";
import { StoreProvider } from "./store";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LabShell } from "./components/LabShell";

declare const ReactDOM: { createRoot(el: Element): { render(node: ReactNode): void } };

function App() {
  return (
    <ErrorBoundary label="The lab">
      <AuthProvider>
        <StoreProvider>
          <LabShell />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const mount = document.getElementById("lab-root");
if (mount) ReactDOM.createRoot(mount).render(<App />);
