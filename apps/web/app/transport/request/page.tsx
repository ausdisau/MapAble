import Link from "next/link";
import { Suspense } from "react";

import { NewTransportTripForm } from "@/components/transport/NewTransportTripForm";
import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { TransportWorkspaceNav } from "@/components/transport/TransportWorkspaceNav";
import { requireAuth } from "@/lib/auth/guards";
import { canManageParticipantTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Request accessible transport | MapAble Transport",
  description:
    "Request an accessible transport trip with mobility needs, pickup and drop-off details.",
};

function TripFormFallback() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Loading the trip request form…
    </p>
  );
}

export default async function TransportRequestPage() {
  const user = await requireAuth();

  if (!canManageParticipantTransport(user)) {
    return (
      <TransportAccessDenied
        title="You cannot create a transport request with this account"
        description="Trip requests require a participant transport permission. If you are a delegate, ask the participant to grant transport access. Operators and drivers use their own workspaces."
        secondaryHref="/transport/dashboard"
        secondaryLabel="View transport trips"
      />
    );
  }

  return (
    <>
      <TransportWorkspaceNav activeHref="/transport/request" />
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-8 lg:px-8">
        <p>
          <Link
            href="/transport/dashboard"
            className="text-sm font-medium text-[#005B7F] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            ← Back to my trips
          </Link>
        </p>
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
            Request accessible transport
          </h1>
          <p className="text-sm text-slate-600">
            This creates a trip request for the pilot. Route estimates are
            advisory and are not a guarantee of timing or NDIS payment approval.
            A quote is not confirmed until you explicitly accept one. Funding is
            not marked as covered unless a verified rule or provider response
            supports it.
          </p>
        </header>
        <Suspense fallback={<TripFormFallback />}>
          <NewTransportTripForm />
        </Suspense>
      </div>
    </>
  );
}
