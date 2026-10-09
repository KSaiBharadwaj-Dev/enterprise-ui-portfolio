/* Domain types and the small type guards that narrow untrusted values to them. */

export type Role = "viewer" | "admin";
export type Severity = "low" | "medium" | "high";
export type RiskStatus = "open" | "mitigating" | "resolved";
export type Fields = Record<string, string>;

export interface Risk {
  readonly id: string;
  title: string;
  owner: string;
  severity: Severity;
  status: RiskStatus;
  reference?: string;
  description?: string;
}
export interface Session {
  readonly token: string;
  readonly user: string;
  readonly role: Role;
  readonly expiresAt: number;
}
export interface NewRisk {
  title: string;
  owner: string;
  severity: Severity;
  reference?: string;
  description: string;
}
export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: Fields };

export const SEVERITIES: readonly Severity[] = ["low", "medium", "high"];
export const STATUSES: readonly RiskStatus[] = ["open", "mitigating", "resolved"];
export const isSeverity = (v: unknown): v is Severity => SEVERITIES.some((s) => s === v);
export const isStatus = (v: unknown): v is RiskStatus => STATUSES.some((s) => s === v);
