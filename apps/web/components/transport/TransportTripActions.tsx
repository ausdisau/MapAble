"use client";

import { useRouter } from "next/navigation";

import { TransportTripActionDialogs } from "@/components/transport/TransportTripActionDialogs";
import type { TransportNextAction } from "@/types/transport";

export function TransportTripActions({
  tripId,
  actions,
  organisationId,
}: {
  tripId: string;
  actions: TransportNextAction[];
  organisationId?: string;
}) {
  const router = useRouter();

  return (
    <TransportTripActionDialogs
      tripId={tripId}
      actions={actions}
      organisationId={organisationId}
      onComplete={() => router.refresh()}
    />
  );
}
