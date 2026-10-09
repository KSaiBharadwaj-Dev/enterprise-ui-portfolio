/* Authentication context: session state, expiry, and one place that handles a 401. */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "./react";
import { api } from "./api";
import type { RequestOptions } from "./api";
import { HttpError } from "./errors";
import type { HttpMethod } from "./server";
import { useNow } from "./hooks/useNow";
import type { Session } from "./types";

interface AuthApi {
  session: Session | null;
  notice: string | null;
  secondsLeft: number;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  extend(): Promise<void>;
  request<T>(method: HttpMethod, path: string, opts?: RequestOptions): Promise<T>;
}
const AuthContext = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The token lives in memory only. Nothing goes to localStorage,
  // so a script injected later cannot read it back.
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;
  const now = useNow(session ? 500 : null);
  const secondsLeft = session ? Math.max(0, Math.ceil((session.expiresAt - now) / 1000)) : 0;

  const endSession = useCallback((message: string | null) => {
    setSession(null);
    setNotice(message);
  }, []);

  useEffect(() => {
    if (session && now >= session.expiresAt) endSession("Your session expired. Sign in again.");
  }, [now, session, endSession]);

  const request = useCallback(
    async <T,>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> => {
      try {
        return await api<T>(method, path, {
          ...opts,
          ...(sessionRef.current ? { token: sessionRef.current.token } : {}),
        });
      } catch (err) {
        // One place decides what a 401 means for the whole app.
        if (err instanceof HttpError && err.status === 401 && sessionRef.current)
          endSession("Your session ended. Sign in again.");
        throw err;
      }
    },
    [endSession],
  );

  const value = useMemo<AuthApi>(
    () => ({
      session,
      notice,
      secondsLeft,
      async signIn(username, password) {
        const next = await api<Session>("POST", "/session", { body: { username, password } });
        setNotice(null);
        setSession(next);
      },
      async signOut() {
        const token = sessionRef.current?.token;
        endSession("You signed out.");
        if (token) await api("DELETE", "/session", { token }).catch(() => undefined);
      },
      async extend() {
        const renewed = await request<Session>("POST", "/session/refresh");
        // If the person signed out while this was in flight, do not bring the session back.
        if (sessionRef.current?.token === renewed.token) setSession(renewed);
      },
      request,
    }),
    [session, notice, secondsLeft, request, endSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
