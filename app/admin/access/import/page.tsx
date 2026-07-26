import Link from "next/link";

import { KmlImportForm } from "@/components/access-import/KmlImportForm";
import {
  ACCESS_ADL_KML_FILENAME,
  ACCESS_LEGACY_GEOJSON_FILENAME,
  ACCESS_LEGACY_KML_FILENAME,
  MAPABLE_MY_MAPS_KML_URL,
  MAPABLE_MY_MAPS_SHARE_URL,
} from "@/lib/access/map/copy";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessImportPage() {
  await requireAdmin();
  const jobs = await prisma.accessImportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, fileName: true, sourceType: true, createdAt: true },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Import places</h1>
      <p className="text-sm text-muted-foreground">
        Upload <strong>{ACCESS_ADL_KML_FILENAME}</strong> or{" "}
        <strong>{ACCESS_LEGACY_KML_FILENAME}</strong> (NetworkLink / full Google My Maps
        export) or <strong>{ACCESS_LEGACY_GEOJSON_FILENAME}</strong> from{" "}
        <code>G:\Operations\MapAble\</code> into <code>data/imports/</code>, or use the
        forms below. Access Map also loads the synced dataset from{" "}
        <code>public/data/mapable-adl-places.json</code>.
      </p>
      <p className="text-sm text-muted-foreground">
        Google My Maps:{" "}
        <a className="underline" href={MAPABLE_MY_MAPS_SHARE_URL} rel="noreferrer">
          open shared map
        </a>{" "}
        · import uses{" "}
        <a className="underline" href={MAPABLE_MY_MAPS_KML_URL} rel="noreferrer">
          KML export
        </a>
        .
      </p>
      <KmlImportForm networkLinkUrl={MAPABLE_MY_MAPS_SHARE_URL} />
      <section>
        <h2 className="text-lg font-semibold">Recent jobs</h2>
        <ul className="mt-2 space-y-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/admin/access/import/${j.id}`} className="underline">
                {j.fileName ?? j.sourceType} — {j.status}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
