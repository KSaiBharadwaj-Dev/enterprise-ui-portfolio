/* Error boundary: a render crash stays inside its panel. */
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "../react";

interface BoundaryProps {
  label: string;
  children: ReactNode;
  onReset?: () => void;
}
export class ErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label}]`, error.message, info.componentStack); // a real app reports this to monitoring
  }
  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="lab-crash" role="alert">
          <p>
            <strong>{this.props.label} hit an error.</strong> It was contained here, and the rest of
            the app is still running.
          </p>
          <p className="lab-hint">{this.state.error.name}</p>
          <button
            type="button"
            className="lab-btn"
            onClick={() => {
              this.props.onReset?.();
              this.setState({ error: null });
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
