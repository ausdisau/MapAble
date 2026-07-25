import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessDashboardPage() {
  await requireAdmin();

  const [
    totalPlaces,
    pendingPlaces,
    pendingReviews,
    pendingReports,
    importJobs,
    accredited,
  ] = await Promise.all([
    prisma.accessPlace.count(),
    prisma.accessPlace.count({ where: { status: "pending_moderation" } }),
    prisma.accessModerationQueue.count({ where: { status: "pending" } }),
    prisma.accessContentReport.count({ where: { status: "pending" } }),
    prisma.accessImportJob.count(),
    prisma.accessAccreditationAssessment.count({ where: { status: "published" } }),
  ]);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">MapAble Access admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total places" value={totalPlaces} />
        <StatCard label="Places pending moderation" value={pendingPlaces} />
        <StatCard label="Moderation queue" value={pendingReviews} />
        <StatCard label="Reported content" value={pendingReports} />
        <StatCard label="Import jobs" value={importJobs} />
        <StatCard label="Accredited venues" value={accredited} />
      </div>
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/access/places" className="underline">
          Places
        </Link>
        <Link href="/admin/access/reviews" className="underline">
          Reviews / moderation
        </Link>
        <Link href="/admin/access/import" className="underline">
          KML / GeoJSON import
        </Link>
        <Link href="/admin/access/accreditation" className="underline">
          Accreditation
        </Link>
        <Link href="/admin/access/moderation" className="underline">
          Moderation
        </Link>
        <Link href="/admin/access/analytics" className="underline">
          Analytics
        </Link>
        <Link href="/access" className="underline">
          Public map
        </Link>
      </nav>
      <p className="text-sm text-muted-foreground">
        Legacy data: copy MapAble by Australian Disability Ltd.kml (or MapAble.kml)
        and accessible_locations_merged.geojson from Operations into{" "}
        <code>data/imports/</code>, sync Access Map with{" "}
        <code>python3 scripts/sync-mapable-adl-kml.py</code>, or import via KML /
        GeoJSON admin UI.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
