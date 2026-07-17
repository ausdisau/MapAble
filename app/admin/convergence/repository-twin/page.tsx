import { redirect } from "next/navigation";

import { ConvergenceActionButton } from "@/components/admin/convergence/ConvergenceActionButton";
import {
  ConvergenceDataTable,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceTwinEnabled } from "@/lib/config/convergence-os";
import { getTwinOverview } from "@/lib/convergence-os/twin/store";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Repository Twin | ConvergenceOS" };

export default async function RepositoryTwinPage() {
  if (!isConvergenceTwinEnabled()) redirect("/admin");

  const overview = await getTwinOverview();
  const modules = overview.snapshotId
    ? await prisma.twinModule.findMany({
        where: { snapshotId: overview.snapshotId },
        orderBy: { moduleKey: "asc" },
      })
    : overview.inventoryPreview.modules.map((m, i) => ({
        id: String(i),
        ...m,
      }));

  const routes = overview.snapshotId
    ? await prisma.twinRoute.findMany({
        where: { snapshotId: overview.snapshotId },
        orderBy: { path: "asc" },
        take: 40,
      })
    : [];

  return (
    <ConvergenceShell
      title="Repository Digital Twin"
      description="Versioned inventory of packages, modules, routes, flags, and graph edges. Capture is read-only against GitHub — no merges, no source rewrites."
    >
      <section className="space-y-3 rounded-md border border-border p-4">
        <h2 className="text-lg font-semibold">Snapshot</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Snapshot ID: {overview.snapshotId ?? "none — run twin scan"}</li>
          <li>Kind: {overview.snapshotKind ?? "—"}</li>
          <li>
            Commit:{" "}
            {overview.baseCommitSha
              ? overview.baseCommitSha.slice(0, 12)
              : "—"}
          </li>
          <li>
            Counts: {overview.counts.packages} packages ·{" "}
            {overview.counts.modules} modules · {overview.counts.routes} routes ·{" "}
            {overview.counts.flags} flags · {overview.counts.edges} edges
          </li>
          <li>
            Hashes: schema {overview.hashes.schemaHash?.slice(0, 8) ?? "—"} ·
            packages {overview.hashes.packageGraphHash?.slice(0, 8) ?? "—"} ·
            routes {overview.hashes.routeGraphHash?.slice(0, 8) ?? "—"}
          </li>
        </ul>
        <ConvergenceActionButton
          label="Run twin scan"
          endpoint="/api/convergence/scans/twin"
          doneMessage="Twin inventory captured. Advisory only."
        />
      </section>

      <ConvergenceDataTable
        caption="Twin modules"
        rows={modules as Array<{ id?: string; moduleKey: string; path: string; programme?: string | null; writerCount?: number; routeCount?: number; description?: string | null }>}
        columns={[
          { key: "moduleKey", header: "Module", cell: (r) => r.moduleKey },
          { key: "path", header: "Path", cell: (r) => r.path },
          {
            key: "programme",
            header: "Programme",
            cell: (r) => r.programme ?? "—",
          },
          {
            key: "writers",
            header: "Writers",
            cell: (r) => String(r.writerCount ?? 0),
          },
          {
            key: "routes",
            header: "Routes",
            cell: (r) => String(r.routeCount ?? 0),
          },
          {
            key: "description",
            header: "Description",
            cell: (r) => r.description ?? "—",
          },
        ]}
      />

      <ConvergenceDataTable
        caption="Sample API routes"
        rows={routes}
        emptyMessage="No persisted routes yet — run twin scan."
        columns={[
          { key: "method", header: "Method", cell: (r) => r.method },
          { key: "path", header: "Path", cell: (r) => r.path },
          {
            key: "module",
            header: "Module",
            cell: (r) => r.moduleKey ?? "—",
          },
          {
            key: "sideEffects",
            header: "Side effects",
            cell: (r) => (r.sideEffects ? "yes" : "no"),
          },
        ]}
      />
    </ConvergenceShell>
  );
}
