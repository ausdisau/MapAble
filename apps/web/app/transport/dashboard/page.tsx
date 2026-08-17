import { redirect } from "next/navigation";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessParticipantTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

/**
 * Pack alias for the participant transport dashboard.
 * Canonical list UI remains under /dashboard/transport (dashboard shell).
 */
export default async function TransportDashboardAliasPage() {
  const user = await requireAuth();

  if (!canAccessParticipantTransport(user)) {
    return (
      <TransportAccessDenied
        title="Transport trips are not available for this account"
        description="Your role does not include participant transport access. Operators should use the operator workspace; drivers should use the driver workspace."
        secondaryHref="/transport/operator"
        secondaryLabel="Operator workspace"
      />
    );
  }

  redirect("/dashboard/transport");
}
