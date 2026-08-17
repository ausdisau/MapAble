"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
  OpsStatusCell,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  status: string;
  reason: string;
  href: string;
};

export function BillingAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Billing exceptions"
      description="Invoices and exports that need attention. Payment metadata is redacted for safeguarding-only roles."
      apiPath="/api/admin/billing"
      breadcrumb={[{ label: "Operations", href: "/admin/ops" }, { label: "Billing", href: "/admin/ops/billing" }]}
      showSearch={false}
      columns={[
        {
          key: "invoice",
          header: "Invoice",
          render: (r) => <OpsRowLink href={r.href} label={r.id.slice(0, 10)} />,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <OpsStatusCell status={r.status} />,
        },
        {
          key: "reason",
          header: "Reason",
          render: (r) => r.reason,
        },
      ]}
    />
  );
}
