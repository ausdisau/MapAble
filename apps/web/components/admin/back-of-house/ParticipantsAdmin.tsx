"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  displayName: string;
  homeSuburb?: string | null;
  pendingCareRequests?: number;
  href: string;
};

export function ParticipantsAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Participants"
      description="Operational view of participant profiles and pending care confirmations."
      apiPath="/api/admin/participants"
      breadcrumb={[{ label: "Operations", href: "/admin/ops" }, { label: "Participants", href: "/admin/ops/participants" }]}
      columns={[
        {
          key: "name",
          header: "Participant",
          render: (r) => <OpsRowLink href={r.href} label={r.displayName} />,
        },
        {
          key: "location",
          header: "Location",
          render: (r) => r.homeSuburb ?? "—",
        },
        {
          key: "pending",
          header: "Pending requests",
          render: (r) => r.pendingCareRequests ?? 0,
        },
      ]}
    />
  );
}
