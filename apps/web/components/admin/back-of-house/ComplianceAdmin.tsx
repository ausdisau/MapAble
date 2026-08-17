"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
  OpsStatusCell,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  title: string;
  status: string;
  dueAt?: string | null;
  href: string;
};

export function ComplianceAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Compliance tasks"
      description="Open compliance tasks and items due within the next two weeks."
      apiPath="/api/admin/compliance"
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        { label: "Compliance", href: "/admin/ops/compliance" },
      ]}
      columns={[
        {
          key: "title",
          header: "Task",
          render: (r) => <OpsRowLink href={r.href} label={r.title} />,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <OpsStatusCell status={r.status} />,
        },
        {
          key: "due",
          header: "Due",
          render: (r) =>
            r.dueAt ? new Date(r.dueAt).toLocaleDateString("en-AU") : "No due date",
        },
      ]}
    />
  );
}
