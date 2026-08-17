"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
  OpsStatusCell,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  status: string;
  atRisk: boolean;
  atRiskReason?: string;
  href: string;
};

export function BookingsAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Bookings"
      description="Care bookings with at-risk indicators including unassigned workers and transport gaps."
      apiPath="/api/admin/bookings"
      breadcrumb={[{ label: "Operations", href: "/admin/ops" }, { label: "Bookings", href: "/admin/ops/bookings" }]}
      showAtRiskFilter
      columns={[
        {
          key: "id",
          header: "Booking",
          render: (r) => <OpsRowLink href={r.href} label={r.id.slice(0, 8)} />,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <OpsStatusCell status={r.status} />,
        },
        {
          key: "risk",
          header: "Risk",
          render: (r) =>
            r.atRisk ? (
              <span className="text-sm text-amber-900">{r.atRiskReason ?? "At risk"}</span>
            ) : (
              "—"
            ),
        },
      ]}
    />
  );
}
