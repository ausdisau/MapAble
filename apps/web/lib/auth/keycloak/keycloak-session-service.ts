import { cookies } from "next/headers";

const KEYCLOAK_STATE_COOKIE = "keycloak_oauth_state";

export async function setKeycloakOAuthState(state: string) {
  const store = await cookies();
  store.set(KEYCLOAK_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
}

export async function consumeKeycloakOAuthState(
  state: string
): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(KEYCLOAK_STATE_COOKIE)?.value;
  store.delete(KEYCLOAK_STATE_COOKIE);
  return Boolean(expected && expected === state);
}

export function isSafeRedirect(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}
