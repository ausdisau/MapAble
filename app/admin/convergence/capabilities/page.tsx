import { redirect } from "next/navigation";

import { ConvergenceDataTable } from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceCapabilityCatalogueEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Capabilities | ConvergenceOS" };

export default async function ConvergenceCapabilitiesPage() {
  if (!isConvergenceCapabilityCatalogueEnabled()) redirect("/admin");

  const capabilities = await prisma.platformCapability.findMany({
    orderBy: [{ programme: "asc" }, { name: "asc" }],
  });

  return (
    <ConvergenceShell
      title="Capability catalogue"
      description="Honest maturity labels. Implemented is not the same as production-supported."
    >
      <ConvergenceDataTable
        caption="Platform capabilities"
        rows={capabilities}
        columns={[
          { key: "key", header: "Key", cell: (c) => c.capabilityKey },
          { key: "name", header: "Name", cell: (c) => c.name },
          { key: "programme", header: "Programme", cell: (c) => c.programme ?? "—" },
          { key: "maturity", header: "Maturity", cell: (c) => c.maturity },
          {
            key: "persist",
            header: "Persistence",
            cell: (c) => c.persistenceType ?? "—",
          },
          {
            key: "claim",
            header: "Production claim",
            cell: (c) => c.productionClaimStatus ?? "—",
          },
          {
            key: "honesty",
            header: "Honesty (implemented / enabled / durable / prod)",
            cell: (c) => {
              const h = c.honestyJson as
                | {
                    implemented?: boolean;
                    featureEnabled?: boolean;
                    durable?: boolean;
                    productionSupported?: boolean;
                  }
                | null;
              if (!h) return "—";
              return `${h.implemented ? "yes" : "no"} / ${h.featureEnabled ? "yes" : "no"} / ${h.durable ? "yes" : "no"} / ${h.productionSupported ? "yes" : "no"}`;
            },
          },
        ]}
      />
    </ConvergenceShell>
  );
}
