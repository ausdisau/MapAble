import { redirect } from "next/navigation";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessParticipantTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

/**
 * Pack alias for role-aware trip detail.
 * Canonical detail UI remains under /dashboard/transport/[tripId].
 * Operator and driver detail views stay on their console routes.
 */
export default async function TransportTripAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  if (!canAccessParticipantTransport(user)) {
    return (
      <TransportAccessDenied
        title="You cannot open this trip view"
        description="Participant trip detail requires transport read access. Assigned drivers use /transport/driver; operators use /transport/operator."
        primaryHref="/transport"
        secondaryHref="/transport/driver"
        secondaryLabel="Driver workspace"
      />
    );
  }

  redirect(`/dashboard/transport/${id}`);
}
