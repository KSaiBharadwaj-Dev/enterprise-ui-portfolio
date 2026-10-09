/* Settings. The session length can be changed in data/settings.js. */

interface SiteSettings {
  lab?: { sessionSeconds?: number };
}

const site = (window as unknown as { SITE?: SiteSettings }).SITE;

export const SESSION_SECONDS: number = site?.lab?.sessionSeconds ?? 90;
export const LOCKOUT_MS = 15_000;
export const MAX_ATTEMPTS = 3;
