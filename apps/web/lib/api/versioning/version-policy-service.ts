import type { PublicApiVersionStatus } from "@prisma/client";

import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

const DEFAULT_VERSIONS = [
  { version: "v1", status: "stable" as PublicApiVersionStatus, changelog: "Initial public API" },
  { version: "v2", status: "draft" as PublicApiVersionStatus, changelog: "Expanded scopes — not yet default" },
];

export async function ensureDefaultApiVersions() {
  if (!phase8Config.publicApiVersioningEnabled) return [];
  const results = [];
  for (const v of DEFAULT_VERSIONS) {
    results.push(
      await prisma.publicApiVersion.upsert({
        where: { version: v.version },
        create: v,
        update: {},
      })
    );
  }
  return results;
}

export async function getApiVersionPolicy() {
  await ensureDefaultApiVersions();
  const versions = await prisma.publicApiVersion.findMany({
    orderBy: { version: "asc" },
  });
  const defaultVersion =
    versions.find((v) => v.version === "v1" && v.status === "stable")?.version ??
    "v1";
  return {
    enabled: phase8Config.publicApiVersioningEnabled,
    defaultVersion,
    versions,
    deprecationNotice:
      "v1 remains default until v2 is marked stable and partners are notified.",
  };
}

export async function updateApiVersionStatus(
  version: string,
  status: PublicApiVersionStatus
) {
  return prisma.publicApiVersion.update({
    where: { version },
    data: { status },
  });
}
