import { readFile } from "fs/promises";
import path from "path";

import {
  createImportJob,
  parseImportJobContent,
} from "@/lib/access/import/access-import-job-service";
import {
  ACCESS_ADL_KML_FILENAME,
  ACCESS_IMPORT_DATA_DIR,
  ACCESS_LEGACY_GEOJSON_FILENAME,
  ACCESS_LEGACY_KML_FILENAME,
} from "@/lib/access/map/copy";

export async function loadLegacyFileFromDataDir(
  fileName: string
): Promise<string | null> {
  try {
    const full = path.join(process.cwd(), ACCESS_IMPORT_DATA_DIR, fileName);
    return await readFile(full, "utf8");
  } catch {
    return null;
  }
}

export async function bootstrapLegacyImports(actorId: string) {
  const results: { file: string; jobId?: string; error?: string }[] = [];

  const kmlFileName =
    (await loadLegacyFileFromDataDir(ACCESS_ADL_KML_FILENAME)) != null
      ? ACCESS_ADL_KML_FILENAME
      : ACCESS_LEGACY_KML_FILENAME;
  const kml = await loadLegacyFileFromDataDir(kmlFileName);
  if (kml) {
    const job = await createImportJob({
      createdById: actorId,
      sourceType: "uploaded_kml",
      fileName: kmlFileName,
    });
    await parseImportJobContent(job.id, kml, "uploaded_kml");
    results.push({ file: kmlFileName, jobId: job.id });
  } else {
    results.push({
      file: ACCESS_ADL_KML_FILENAME,
      error: "File not found in data/imports",
    });
  }

  const geo = await loadLegacyFileFromDataDir(ACCESS_LEGACY_GEOJSON_FILENAME);
  if (geo) {
    const job = await createImportJob({
      createdById: actorId,
      sourceType: "geojson_upload",
      fileName: ACCESS_LEGACY_GEOJSON_FILENAME,
    });
    await parseImportJobContent(job.id, geo, "geojson_upload");
    results.push({ file: ACCESS_LEGACY_GEOJSON_FILENAME, jobId: job.id });
  } else {
    results.push({
      file: ACCESS_LEGACY_GEOJSON_FILENAME,
      error: "File not found in data/imports",
    });
  }

  return results;
}
