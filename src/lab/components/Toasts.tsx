/* Toasts: success messages clear themselves, errors stay until dismissed. */
import { useEffect, useRef } from "../react";
import { useStore } from "../store";

const SUCCESS_MS = 4000;

export function Toasts() {
  const { state, dispatch } = useStore();
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const live = new Set(state.toasts.map((t) => t.id));
    state.toasts.forEach((t) => {
      if (t.kind === "error" || timers.current.has(t.id)) return;
      const timer = window.setTimeout(
        () => dispatch({ type: "toast/dismiss", id: t.id }),
        SUCCESS_MS,
      );
      timers.current.set(t.id, timer);
    });
    timers.current.forEach((timer, id) => {
      if (live.has(id)) return;
      window.clearTimeout(timer); // the toast is gone, so its timer is not needed
      timers.current.delete(id);
    });
  }, [state.toasts, dispatch]);

  // Stop every pending timer when the component goes away.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return (
    <div className="lab-toasts" role="status" aria-live="polite">
      {state.toasts.map((t) => (
        <div key={t.id} className={`lab-toast is-${t.kind}`}>
          <span>{t.text}</span>
          {t.retry && (
            <button
              type="button"
              className="lab-btn lab-btn-small"
              onClick={() => {
                t.retry?.();
                dispatch({ type: "toast/dismiss", id: t.id });
              }}
            >
              Retry
            </button>
          )}
          <button
            type="button"
            className="lab-btn lab-btn-small"
            onClick={() => dispatch({ type: "toast/dismiss", id: t.id })}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
