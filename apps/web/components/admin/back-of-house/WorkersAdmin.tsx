"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
  OpsStatusCell,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  displayName: string;
  verificationStatus: string;
  wwccStatus: string;
  credentialAlert: boolean;
  href: string;
};

export function WorkersAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Workers"
      description="Credential and verification status across active workers. Screening certificate queue: /admin/ops/screening"
      apiPath="/api/admin/workers"
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        { label: "Workers", href: "/admin/ops/workers" },
        { label: "Screening", href: "/admin/ops/screening" },
      ]}
      showAtRiskFilter
      columns={[
        {
          key: "name",
          header: "Worker",
          render: (r) => <OpsRowLink href={r.href} label={r.displayName} />,
        },
        {
          key: "verification",
          header: "Verification",
          render: (r) => <OpsStatusCell status={r.verificationStatus} />,
        },
        {
          key: "wwcc",
          header: "WWCC",
          render: (r) => <OpsStatusCell status={r.wwccStatus} />,
        },
        {
          key: "alert",
          header: "Alert",
          render: (r) =>
            r.credentialAlert ? (
              <span className="text-sm font-medium text-amber-800">Credential review</span>
            ) : (
              "—"
            ),
        },
      ]}
    />
  );
}
