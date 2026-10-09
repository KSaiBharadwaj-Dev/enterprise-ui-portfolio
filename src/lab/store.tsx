/* Store provider: one reducer owns the data, and every write goes through these actions. */
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "./react";
import { useAuth } from "./auth";
import { HttpError, userMessage } from "./errors";
import { initialState, reducer } from "./state";
import type { Action, State, Toast } from "./state";
import type { NewRisk, Risk, RiskStatus } from "./types";

interface StoreApi {
  state: State;
  dispatch: (action: Action) => void;
  reload(): Promise<void>;
  setStatus(id: string, status: RiskStatus): Promise<void>;
  create(input: NewRisk): Promise<Risk>;
}
const StoreContext = createContext<StoreApi | null>(null);
export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

let toastSeq = 0;

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, request } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Bumped on every sign-out. An answer that arrives for an older number is ignored.
  const epoch = useRef(0);

  const actions = useMemo(() => {
    const toast = (kind: Toast["kind"], text: string, retry?: () => void): void =>
      dispatch({
        type: "toast/push",
        toast: { id: ++toastSeq, kind, text, ...(retry ? { retry } : {}) },
      });

    async function reload(): Promise<void> {
      const mine = epoch.current;
      dispatch({ type: "load/start" });
      try {
        const items = await request<Risk[]>("GET", "/risks", { retries: 2 });
        if (mine === epoch.current) dispatch({ type: "load/ok", items });
      } catch (err) {
        if (mine !== epoch.current) return;
        if (err instanceof HttpError && err.status === 401) return; // the auth layer already ended the session
        dispatch({ type: "load/fail", message: userMessage(err) });
      }
    }

    async function setStatus(id: string, status: RiskStatus): Promise<void> {
      const previous = stateRef.current.items.find((r) => r.id === id);
      if (!previous || previous.status === status || stateRef.current.pending.includes(id)) return;
      const mine = epoch.current;
      dispatch({ type: "update/optimistic", id, status }); // show the change at once
      try {
        await request<Risk>("PATCH", `/risks/${id}`, {
          body: { status },
          simulateFailure: stateRef.current.failUpdates,
        });
        if (mine !== epoch.current) return;
        dispatch({ type: "update/settled", id });
        toast("success", `${id} is now ${status}.`);
      } catch (err) {
        if (mine !== epoch.current) return;
        dispatch({ type: "update/rollback", previous }); // put the old row back
        toast("error", `${userMessage(err)} ${id} was restored.`, () => void setStatus(id, status));
      }
    }

    async function create(input: NewRisk): Promise<Risk> {
      const mine = epoch.current;
      const risk = await request<Risk>("POST", "/risks", { body: input });
      if (mine === epoch.current) dispatch({ type: "add", risk });
      return risk;
    }
    return { reload, setStatus, create };
  }, [request]);

  const token = session?.token ?? null;
  useEffect(() => {
    if (token === null) {
      epoch.current += 1;
      dispatch({ type: "reset" });
    } else if (stateRef.current.load === "idle") void actions.reload();
  }, [token, actions]);

  const value = useMemo<StoreApi>(() => ({ state, dispatch, ...actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
