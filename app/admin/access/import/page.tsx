import Link from "next/link";

import { KmlImportForm } from "@/components/access-import/KmlImportForm";
import {
  ACCESS_LEGACY_GEOJSON_FILENAME,
  ACCESS_LEGACY_KML_FILENAME,
  MAPABLE_MY_MAPS_KML_URL,
} from "@/lib/access-map/copy";
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
        Upload <strong>{ACCESS_LEGACY_KML_FILENAME}</strong> (NetworkLink to Google My Maps) or{" "}
        <strong>{ACCESS_LEGACY_GEOJSON_FILENAME}</strong> from your operations folder into{" "}
        <code>data/imports/</code>, or use the forms below.
      </p>
      <KmlImportForm networkLinkUrl={MAPABLE_MY_MAPS_KML_URL} />
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
