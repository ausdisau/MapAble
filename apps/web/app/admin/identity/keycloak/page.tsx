import { KeycloakConnectionPanel } from "@/components/identity/KeycloakConnectionPanel";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminKeycloakPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Keycloak identity</h1>
      <KeycloakConnectionPanel />
    </div>
  );
}
