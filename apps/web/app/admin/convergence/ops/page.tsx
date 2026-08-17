import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import {
  ConvergenceDataTable,
  RiskBadge,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import {
  isConvergenceDriftEnabled,
  isConvergenceEnvParityEnabled,
  isConvergenceFederationEnabled,
  isConvergenceGoldenJourneyEnabled,
  isConvergenceOwnershipEnabled,
  isConvergenceOsEnabled,
  isConvergenceSupplyChainEnabled,
} from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Ops assurance | ConvergenceOS" };

export default async function ConvergenceOpsPage() {
  if (!isConvergenceOsEnabled()) redirect("/admin");

  const showDrift = isConvergenceDriftEnabled();
  const showParity = isConvergenceEnvParityEnabled();
  const showSupply = isConvergenceSupplyChainEnabled();
  const showOwnership = isConvergenceOwnershipEnabled();
  const showJourneys = isConvergenceGoldenJourneyEnabled();
  const showFederation = isConvergenceFederationEnabled();

  if (
    !showDrift &&
    !showParity &&
    !showSupply &&
    !showOwnership &&
    !showJourneys &&
    !showFederation
  ) {
    redirect("/admin");
  }

  const [drift, envs, secrets, deps, ownership, journeys, repos, complexity] =
    await Promise.all([
      showDrift
        ? prisma.driftFinding.findMany({ orderBy: { createdAt: "desc" } })
        : Promise.resolve([]),
      showParity
        ? prisma.environmentParityRecord.findMany({
            orderBy: { environmentKey: "asc" },
          })
        : Promise.resolve([]),
      showParity
        ? prisma.secretContract.findMany({ orderBy: { secretName: "asc" } })
        : Promise.resolve([]),
      showSupply
        ? prisma.supplyChainDependency.findMany({
            orderBy: { packageName: "asc" },
          })
        : Promise.resolve([]),
      showOwnership
        ? prisma.ownershipRecord.findMany({
            orderBy: { subjectKey: "asc" },
            take: 40,
          })
        : Promise.resolve([]),
      showJourneys
        ? prisma.goldenJourney.findMany({
            include: { steps: { orderBy: { stepOrder: "asc" } } },
          })
        : Promise.resolve([]),
      showFederation
        ? prisma.federatedRepository.findMany({ include: { contracts: true } })
        : Promise.resolve([]),
      showFederation
        ? prisma.complexityBudgetSnapshot.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

  return (
    <ConvergenceShell
      title="Drift, parity, ownership, journeys, federation"
      description="Waves 15–17 advisory surfaces. Drift does not auto-remediate. Federation does not mutate remotes. Secret values are never stored."
    >
      <div className="flex flex-wrap gap-3">
        <ConvergenceActionButton
          label="Seed Iteration 2 registries"
          endpoint="/api/convergence/seed/iteration2"
          doneMessage="Iteration 2 registries seeded (advisory)."
        />
      </div>

      {showDrift ? (
        <ConvergenceDataTable
          caption="Drift findings"
          rows={drift}
          columns={[
            { key: "layer", header: "Layer", cell: (d) => d.layer },
            { key: "title", header: "Title", cell: (d) => d.title },
            {
              key: "severity",
              header: "Severity",
              cell: (d) => <RiskBadge risk={d.severity} />,
            },
            {
              key: "action",
              header: "Suggested action",
              cell: (d) => d.suggestedAction ?? "—",
            },
          ]}
        />
      ) : null}

      {showParity ? (
        <>
          <ConvergenceDataTable
            caption="Environment parity"
            rows={envs}
            columns={[
              {
                key: "env",
                header: "Environment",
                cell: (e) => e.environmentKey,
              },
              { key: "label", header: "Label", cell: (e) => e.label },
              {
                key: "synthetic",
                header: "Synthetic data",
                cell: (e) => (e.syntheticData ? "yes" : "no"),
              },
              {
                key: "class",
                header: "Classification",
                cell: (e) => e.dataClassification ?? "—",
              },
            ]}
          />
          <ConvergenceDataTable
            caption="Secret contracts (presence only)"
            rows={secrets}
            columns={[
              { key: "name", header: "Name", cell: (s) => s.secretName },
              { key: "owner", header: "Owner", cell: (s) => s.owner ?? "—" },
              {
                key: "purpose",
                header: "Purpose",
                cell: (s) => s.purpose ?? "—",
              },
              {
                key: "required",
                header: "Required",
                cell: (s) => (s.required ? "yes" : "no"),
              },
            ]}
          />
        </>
      ) : null}

      {showSupply ? (
        <ConvergenceDataTable
          caption="Supply-chain dependencies"
          rows={deps}
          columns={[
            { key: "pkg", header: "Package", cell: (d) => d.packageName },
            { key: "ver", header: "Version", cell: (d) => d.version ?? "—" },
            {
              key: "status",
              header: "Security",
              cell: (d) => d.securityStatus,
            },
            {
              key: "policy",
              header: "Upgrade policy",
              cell: (d) => d.upgradePolicy ?? "—",
            },
          ]}
        />
      ) : null}

      {showOwnership ? (
        <ConvergenceDataTable
          caption="Ownership registry"
          rows={ownership}
          columns={[
            { key: "type", header: "Type", cell: (o) => o.subjectType },
            { key: "key", header: "Subject", cell: (o) => o.subjectKey },
            {
              key: "owner",
              header: "Primary owner",
              cell: (o) => o.primaryOwner ?? "—",
            },
            {
              key: "succ",
              header: "Succession",
              cell: (o) => o.successionState,
            },
          ]}
        />
      ) : null}

      {showJourneys ? (
        <ConvergenceDataTable
          caption="Golden journeys"
          rows={journeys}
          columns={[
            { key: "key", header: "Key", cell: (j) => j.journeyKey },
            { key: "title", header: "Title", cell: (j) => j.title },
            {
              key: "steps",
              header: "Steps",
              cell: (j) =>
                j.steps.map((s) => `${s.stepOrder}. ${s.title}`).join(" · "),
            },
          ]}
        />
      ) : null}

      {showFederation ? (
        <>
          <ConvergenceDataTable
            caption="Federated repositories"
            rows={repos}
            columns={[
              { key: "key", header: "Repo", cell: (r) => r.repoKey },
              { key: "name", header: "Name", cell: (r) => r.name },
              { key: "role", header: "Role", cell: (r) => r.role },
              {
                key: "contracts",
                header: "Contracts",
                cell: (r) =>
                  r.contracts.map((c) => c.contractKey).join(", ") || "—",
              },
            ]}
          />
          <ConvergenceDataTable
            caption="Complexity budget snapshots"
            rows={complexity}
            columns={[
              {
                key: "key",
                header: "Key",
                cell: (c) => c.snapshotKey,
              },
              {
                key: "created",
                header: "Created",
                cell: (c) => c.createdAt.toISOString(),
              },
            ]}
          />
        </>
      ) : null}
    </ConvergenceShell>
  );
}
