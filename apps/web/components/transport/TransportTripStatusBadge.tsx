import type { TransportTripStatus } from "@prisma/client";

import { transportTripStatusLabel } from "@/lib/transport/transport-status-labels";

export function TransportTripStatusBadge({
  status,
}: {
  status: TransportTripStatus | string;
}) {
  const label = transportTripStatusLabel(status);
  return (
    <span className="inline-flex min-h-8 items-center rounded-md border border-border bg-muted px-2 text-sm font-medium">
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
