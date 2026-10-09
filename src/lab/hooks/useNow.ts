/* A clock that re-renders on an interval and stops when the component goes away. */
import { useEffect, useState } from "../react";

export function useNow(intervalMs: number | null): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (intervalMs === null) return undefined;
    const timer = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  // Read at render time, so the first render after the clock starts is already correct.
  return Date.now();
}
