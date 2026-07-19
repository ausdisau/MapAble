import Link from "next/link";
import { Suspense } from "react";

import { NewTransportTripForm } from "@/components/transport/NewTransportTripForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book accessible transport | MapAble Core",
  description:
    "Request an accessible transport trip with mobility needs, pickup and drop-off details.",
};

function TripFormFallback() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Loading the booking form…
    </p>
  );
}

export default function NewTransportTripPage() {
  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/transport/dashboard"
          className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to transport trips
        </Link>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Book accessible transport</h1>
        <p className="text-sm text-muted-foreground">
          Compatibility route for the participant request flow. Prefer{" "}
          <Link href="/transport/request" className="font-medium text-primary underline">
            /transport/request
          </Link>
          . Route estimates are advisory and are not a guarantee of timing or
          NDIS payment approval. Assignment still requires eligibility checks.
        </p>
      </header>
      <Suspense fallback={<TripFormFallback />}>
        <NewTransportTripForm />
      </Suspense>
    </div>
  );
}
