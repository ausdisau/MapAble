/** Shared session/JWT lifetime (seconds) — 30 days. */
export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type AuthJwtUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  /** Set when the credentials authorize path completed MFA / passkey. */
  mfaVerified?: boolean;
};

export function mergeUserIntoJwtToken(
  token: Record<string, unknown>,
  user: AuthJwtUser
): Record<string, unknown> {
  token.id = user.id;
  if (user.role) token.role = user.role;
  if (user.email) token.email = user.email;
  if (user.name) token.name = user.name;
  if (user.mfaVerified) {
    token.mfaVerified = true;
    token.mfaVerifiedAt = Date.now();
  }
  return token;
}

export function mergeJwtTokenIntoSession(
  session: { user?: Record<string, unknown> },
  token: Record<string, unknown>
): typeof session {
  if (!session.user) {
    session.user = {};
  }
  if (typeof token.id === "string") session.user.id = token.id;
  if (typeof token.role === "string") session.user.role = token.role;
  if (typeof token.email === "string") session.user.email = token.email;
  if (typeof token.name === "string") session.user.name = token.name;
  if (token.mfaVerified === true) session.user.mfaVerified = true;
  return session;
}
