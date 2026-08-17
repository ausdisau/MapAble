"use client";

import {
  AdminOpsListPage,
  OpsRowLink,
  OpsStatusCell,
} from "@/components/admin/back-of-house/AdminOpsListPage";

type Row = {
  id: string;
  kind: string;
  title: string;
  severity: string;
  status: string;
  descriptionPreview?: string | null;
  href: string;
};

export function SafeguardingAdmin() {
  return (
    <AdminOpsListPage<Row>
      title="Safeguarding"
      description="Open incidents and active risk flags. Full narratives are audit logged when viewed."
      apiPath="/api/admin/safeguarding"
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        { label: "Safeguarding", href: "/admin/ops/safeguarding" },
      ]}
      columns={[
        {
          key: "title",
          header: "Item",
          render: (r) => <OpsRowLink href={r.href} label={r.title} />,
        },
        {
          key: "kind",
          header: "Type",
          render: (r) => r.kind,
        },
        {
          key: "severity",
          header: "Severity",
          render: (r) => <OpsStatusCell status={r.severity} />,
        },
        {
          key: "status",
          header: "Status",
          render: (r) => <OpsStatusCell status={r.status} />,
        },
        {
          key: "preview",
          header: "Preview",
          render: (r) => (
            <span className="line-clamp-2 max-w-xs text-muted-foreground">
              {r.descriptionPreview ?? "Restricted preview"}
            </span>
          ),
        },
      ]}
    />
  );
}
