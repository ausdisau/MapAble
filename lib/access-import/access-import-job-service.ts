import type { AccessImportSourceType } from "@prisma/client";

import { parseAccessibleLocationsGeoJson } from "@/lib/access-import/geojson-parser-service";
import { findDuplicatePlaceCandidates } from "@/lib/access-import/import-deduplication-service";
import { MAX_IMPORT_ITEMS } from "@/lib/access-import/import-limits";
import { resolveKmlDocument } from "@/lib/access-import/kml-networklink-service";
import { sanitizeKmlDescription } from "@/lib/access-import/kml-parser-service";
import { mapPlacemarkToImportItem } from "@/lib/access-import/kml-to-access-place-mapper";
import { prisma } from "@/lib/prisma";

export async function createImportJob(params: {
  createdById: string;
  sourceType: AccessImportSourceType;
  sourceUrl?: string;
  fileName?: string;
}) {
  return prisma.accessImportJob.create({
    data: {
      createdById: params.createdById,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      fileName: params.fileName,
      status: "pending",
    },
  });
}

export async function parseImportJobContent(
  jobId: string,
  content: string,
  sourceType: AccessImportSourceType
) {
  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "parsing" },
  });

  let placemarks: ReturnType<typeof mapPlacemarkToImportItem>[] = [];
  const errors: string[] = [];

  if (sourceType === "geojson_upload") {
    const parsed = parseAccessibleLocationsGeoJson(content);
    errors.push(...parsed.errors);
    placemarks = parsed.placemarks.map(mapPlacemarkToImportItem);
  } else {
    const doc = await resolveKmlDocument(content);
    if (doc.networkLinkHref && !doc.placemarks.length) {
      await prisma.accessImportSource.create({
        data: { jobId, url: doc.networkLinkHref, rawMeta: { type: "network_link" } },
      });
    }
    placemarks = doc.placemarks.map((p) =>
      mapPlacemarkToImportItem({
        ...p,
        description: p.description ? sanitizeKmlDescription(p.description) : undefined,
      })
    );
  }

  if (placemarks.length > MAX_IMPORT_ITEMS) {
    await prisma.accessImportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        metadata: {
          error: `Import exceeds maximum of ${MAX_IMPORT_ITEMS} features`,
          parsed: placemarks.length,
        },
      },
    });
    throw new Error(`IMPORT_ITEM_LIMIT:${placemarks.length}`);
  }

  await prisma.accessImportItem.deleteMany({ where: { jobId } });

  for (const item of placemarks) {
    const conflicts = await findDuplicatePlaceCandidates({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      sourceReference: item.externalRef,
    });

    const importItem = await prisma.accessImportItem.create({
      data: {
        jobId,
        name: item.name,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        category: item.category,
        externalRef: item.externalRef,
        rawData: item.rawData,
        status: conflicts.length ? "conflict" : "pending",
      },
    });

    for (const c of conflicts) {
      await prisma.accessImportConflict.create({
        data: {
          jobId,
          importItemId: importItem.id,
          existingPlaceId: c.placeId,
          resolution: c.reason,
        },
      });
    }
  }

  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "preview_ready", metadata: { parsed: placemarks.length, errors } },
  });

  return { count: placemarks.length, errors };
}
