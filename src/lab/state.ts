/* Risk store state: types, a pure reducer and selectors. */
import type { Risk, RiskStatus, Severity } from "./types";

export type SortKey = "id" | "title" | "owner" | "severity" | "status";
export interface Toast {
  id: number;
  kind: "success" | "error";
  text: string;
  retry?: () => void;
}
export interface State {
  items: readonly Risk[];
  load: "idle" | "loading" | "ready" | "error";
  error: string | null;
  query: string;
  status: RiskStatus | "all";
  sort: { key: SortKey; dir: "asc" | "desc" };
  pending: readonly string[];
  failUpdates: boolean;
  toasts: readonly Toast[];
}
export type Action =
  | { type: "load/start" }
  | { type: "load/ok"; items: readonly Risk[] }
  | { type: "load/fail"; message: string }
  | { type: "query"; value: string }
  | { type: "filter"; value: State["status"] }
  | { type: "sort"; key: SortKey }
  | { type: "update/optimistic"; id: string; status: RiskStatus }
  | { type: "update/settled"; id: string }
  | { type: "update/rollback"; previous: Risk }
  | { type: "add"; risk: Risk }
  | { type: "chaos/updates"; on: boolean }
  | { type: "toast/push"; toast: Toast }
  | { type: "toast/dismiss"; id: number }
  | { type: "reset" };

export const initialState: State = {
  items: [],
  load: "idle",
  error: null,
  query: "",
  status: "all",
  sort: { key: "id", dir: "asc" },
  pending: [],
  failUpdates: false,
  toasts: [],
};

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`); // the compiler flags any action the reducer forgets
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load/start":
      return { ...state, load: "loading", error: null };
    case "load/ok":
      return { ...state, load: "ready", items: action.items, error: null };
    case "load/fail":
      return { ...state, load: "error", error: action.message };
    case "query":
      return { ...state, query: action.value };
    case "filter":
      return { ...state, status: action.value };
    case "sort":
      return {
        ...state,
        sort:
          state.sort.key === action.key
            ? { key: action.key, dir: state.sort.dir === "asc" ? "desc" : "asc" }
            : { key: action.key, dir: "asc" },
      };
    case "update/optimistic":
      return {
        ...state,
        items: state.items.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
        pending: [...state.pending, action.id],
      };
    case "update/settled":
      return { ...state, pending: state.pending.filter((id) => id !== action.id) };
    case "update/rollback":
      return {
        ...state,
        items: state.items.map((r) => (r.id === action.previous.id ? action.previous : r)),
        pending: state.pending.filter((id) => id !== action.previous.id),
      };
    case "add":
      return { ...state, items: [...state.items, action.risk] };
    case "chaos/updates":
      return { ...state, failUpdates: action.on };
    case "toast/push":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "toast/dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "reset":
      return initialState;
    default:
      return assertNever(action);
  }
}

const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
const STATUS_RANK: Record<RiskStatus, number> = { open: 1, mitigating: 2, resolved: 3 };

function compare(a: Risk, b: Risk, key: SortKey): number {
  if (key === "severity") return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (key === "status") return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  return a[key].localeCompare(b[key], undefined, { numeric: true });
}
export function selectVisible(state: State): Risk[] {
  const q = state.query.trim().toLowerCase();
  const rows = state.items.filter(
    (r) =>
      (state.status === "all" || r.status === state.status) &&
      (q === "" || `${r.id} ${r.title} ${r.owner}`.toLowerCase().includes(q)),
  );
  const dir = state.sort.dir === "asc" ? 1 : -1;
  return rows.sort((a, b) => dir * compare(a, b, state.sort.key));
}
