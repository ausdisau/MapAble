import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import {
  ConvergenceDataTable,
  RiskBadge,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceConstitutionEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Constitution | ConvergenceOS" };

export default async function ConstitutionPage() {
  if (!isConvergenceConstitutionEnabled()) redirect("/admin");

  const [rules, exceptions, violations] = await Promise.all([
    prisma.architectureRule.findMany({ orderBy: { ruleKey: "asc" } }),
    prisma.architectureRuleException.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { rule: { select: { ruleKey: true } } },
    }),
    prisma.architectureRuleViolation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { rule: { select: { ruleKey: true } } },
    }),
  ]);

  return (
    <ConvergenceShell
      title="Architecture Constitution"
      description="C-001…C-025 advisory rules. Wave 9 validates and reports only — no merge blocking. AI may draft exceptions; AI cannot approve."
    >
      <div className="flex flex-wrap gap-3">
        <ConvergenceActionButton
          label="Seed C-001…C-025"
          endpoint="/api/convergence/constitution"
          body={{ action: "seed" }}
          doneMessage="Constitution rules seeded."
        />
        <ConvergenceActionButton
          label="Run advisory validation"
          endpoint="/api/convergence/constitution"
          body={{ action: "validate" }}
          doneMessage="Advisory violations recorded — merges not blocked."
        />
      </div>

      <ConvergenceDataTable
        caption="Constitution rules"
        rows={rules}
        emptyMessage="No rules yet — seed the constitution."
        columns={[
          { key: "ruleKey", header: "ID", cell: (r) => r.ruleKey },
          { key: "title", header: "Title", cell: (r) => r.title },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => <RiskBadge risk={r.severity} />,
          },
          { key: "owner", header: "Owner", cell: (r) => r.owner ?? "—" },
          {
            key: "detection",
            header: "Detection",
            cell: (r) => r.detectionMethod ?? "—",
          },
        ]}
      />

      <ConvergenceDataTable
        caption="Open advisory violations"
        rows={violations}
        emptyMessage="No violations recorded."
        columns={[
          {
            key: "rule",
            header: "Rule",
            cell: (v) => v.rule.ruleKey,
          },
          { key: "title", header: "Title", cell: (v) => v.title },
          {
            key: "severity",
            header: "Severity",
            cell: (v) => <RiskBadge risk={v.severity} />,
          },
          {
            key: "evidence",
            header: "Evidence",
            cell: (v) => v.evidence ?? "—",
          },
        ]}
      />

      <ConvergenceDataTable
        caption="Exception workflow"
        rows={exceptions}
        emptyMessage="No exceptions."
        columns={[
          {
            key: "rule",
            header: "Rule",
            cell: (e) => e.rule.ruleKey,
          },
          { key: "status", header: "Status", cell: (e) => e.status },
          {
            key: "reason",
            header: "Business reason",
            cell: (e) => e.businessReason,
          },
          { key: "owner", header: "Owner", cell: (e) => e.owner ?? "—" },
        ]}
      />
    </ConvergenceShell>
  );
}
