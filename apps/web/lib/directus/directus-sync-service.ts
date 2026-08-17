import { createHash } from "crypto";

import { isDirectusEnabled } from "@/lib/directus/directus-client";
import {
  isAllowedContentType,
  sanitizeContentHtml,
  type ContentSyncType,
} from "@/lib/directus/directus-content-service";
import { prisma } from "@/lib/prisma";

export async function syncContentItem(input: {
  contentType: ContentSyncType;
  externalId: string;
  slug: string;
  html: string;
}) {
  if (!isDirectusEnabled()) {
    throw new Error("Directus integration disabled");
  }
  if (!isAllowedContentType(input.contentType)) {
    throw new Error("Content type not allowed");
  }

  const safeHtml = sanitizeContentHtml(input.html);
  const hash = createHash("sha256").update(safeHtml).digest("hex");

  const existing = await prisma.contentSyncRecord.findUnique({
    where: {
      contentType_externalId: {
        contentType: input.contentType,
        externalId: input.externalId,
      },
    },
  });

  if (existing?.payloadHash === hash) {
    return existing;
  }

  const record = await prisma.contentSyncRecord.upsert({
    where: {
      contentType_externalId: {
        contentType: input.contentType,
        externalId: input.externalId,
      },
    },
    create: {
      contentType: input.contentType,
      externalId: input.externalId,
      mapableSlug: input.slug,
      payloadHash: hash,
      status: "synced",
      lastSyncedAt: new Date(),
    },
    update: {
      mapableSlug: input.slug,
      payloadHash: hash,
      status: "synced",
      lastSyncedAt: new Date(),
    },
  });

  await prisma.externalContentReference.upsert({
    where: { slug: input.slug },
    create: {
      contentType: input.contentType,
      slug: input.slug,
      externalId: input.externalId,
      publishedAt: new Date(),
    },
    update: { externalId: input.externalId, publishedAt: new Date() },
  });

  await prisma.contentSyncEvent.create({
    data: {
      contentType: input.contentType,
      eventType: "synced",
      message: `Synced ${input.slug}`,
    },
  });

  return record;
}
