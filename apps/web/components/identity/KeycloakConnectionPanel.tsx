import Link from "next/link";

import { getKeycloakAdminStatus } from "@/lib/auth/keycloak/keycloak-admin-adapter";

export async function KeycloakConnectionPanel() {
  const status = await getKeycloakAdminStatus();
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Keycloak identity</h2>
      <p className="mt-2 text-sm text-muted-foreground">{status.message}</p>
      <p className="mt-2 text-xs">
        Keycloak authenticates identity only. Privileged MapAble roles require
        approval gates.
      </p>
      {status.enabled ? (
        <Link
          href="/api/auth/keycloak/login"
          className="mt-4 inline-block text-sm text-primary underline"
        >
          Test Keycloak login
        </Link>
      ) : null}
    </section>
  );
}
