/* One role-to-permission table. The screen and the API both ask it, so they cannot disagree. */
import type { Role } from "./types";

export type Permission = "risk:read" | "risk:update" | "risk:create";
export const PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  viewer: ["risk:read"],
  admin: ["risk:read", "risk:update", "risk:create"],
};
export const can = (role: Role | undefined, permission: Permission): boolean =>
  role !== undefined && PERMISSIONS[role].includes(permission);
