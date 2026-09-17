/**
 * Password strength rules — keep in sync with backend passwordPolicy.js
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_EXPIRY_DAYS = 90;
export const PASSWORD_HINT =
  `At least ${PASSWORD_MIN_LENGTH} characters with upper, lower, number, and special character`;

const SPECIAL_RE = /[^A-Za-z0-9]/;

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: 'Password must include a lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: 'Password must include an uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: 'Password must include a number' };
  }
  if (!SPECIAL_RE.test(password)) {
    return { ok: false, error: 'Password must include a special character (e.g. !@#$%)' };
  }
  return { ok: true };
}

/** Idle auto-logout (ms) — shared front-desk / clinical workstations */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
