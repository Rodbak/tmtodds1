// Some customers don't have an email address, so admin can create
// their account with just a username + password (see the Members
// section of /admin). Supabase Auth still requires an email under the
// hood, so a username maps to a synthetic address on a placeholder
// domain that never receives mail -- the member only ever sees and
// types their username.
export const MEMBER_EMAIL_DOMAIN = "member.tmtodds.app";

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(input: string): boolean {
  return USERNAME_RE.test(normalizeUsername(input));
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${MEMBER_EMAIL_DOMAIN}`;
}

/**
 * What the login box feeds to Supabase: anything without an "@" is
 * treated as a username and mapped to its synthetic email; a real
 * email passes through unchanged.
 */
export function loginInputToEmail(input: string): string {
  const trimmed = input.trim();
  return trimmed.includes("@") ? trimmed : usernameToEmail(trimmed);
}

/** How an account's login is displayed in the admin member list: usernames shown bare, real emails shown as-is. */
export function displayLogin(email: string): string {
  const suffix = `@${MEMBER_EMAIL_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}
