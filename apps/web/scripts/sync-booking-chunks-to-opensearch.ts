/**
 * Batch-sync booking RAG chunks to OpenSearch (keyword replica).
 * Usage: npx tsx scripts/sync-booking-chunks-to-opensearch.ts [--participant-id=...]
 *
 * Requires OPENSEARCH_URL and admin credentials. Skips when not configured.
 */

import { PrismaClient } from "@prisma/client";

import {
  BOOKING_CHUNK_INDEX_BODY,
  BOOKING_CHUNK_INDEX_V1,
  type BookingChunkIndexDoc,
} from "@/lib/bookings/rag/booking-index";
import { getBookingChunks } from "@/lib/bookings/rag/engine";
import { loadBookingSnapshotsForUser } from "@/lib/bookings/rag/snapshot-loader";
import { isOpenSearchConfigured } from "@/lib/config/opensearch";
import { openSearchFetch } from "@/lib/search/opensearch-client";

const prisma = new PrismaClient();

async function ensureIndex(): Promise<void> {
  const res = await openSearchFetch(`/${BOOKING_CHUNK_INDEX_V1}`, {
    method: "PUT",
    body: JSON.stringify(BOOKING_CHUNK_INDEX_BODY),
  });
  if (!res.ok && res.status !== 400) {
    const text = await res.text();
    throw new Error(`Failed to create index: ${res.status} ${text}`);
  }
}

async function bulkIndex(docs: BookingChunkIndexDoc[]): Promise<void> {
  if (docs.length === 0) return;

  const lines: string[] = [];
  for (const doc of docs) {
    lines.push(JSON.stringify({ index: { _index: BOOKING_CHUNK_INDEX_V1, _id: doc.chunkId } }));
    lines.push(JSON.stringify(doc));
  }

  const res = await openSearchFetch("/_bulk", {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body: `${lines.join("\n")}\n`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bulk index failed: ${res.status} ${text}`);
  }
}

async function main() {
  if (!isOpenSearchConfigured()) {
    console.error("OpenSearch is not configured — set OPENSEARCH_URL.");
    process.exit(1);
  }

  const participantArg = process.argv.find((a) => a.startsWith("--participant-id="));
  const participantId = participantArg?.split("=")[1];

  await ensureIndex();

  const users = participantId
    ? await prisma.user.findMany({ where: { id: participantId }, take: 1 })
    : await prisma.user.findMany({
        where: { primaryRole: "participant" },
        take: 50,
        orderBy: { updatedAt: "desc" },
      });

  let total = 0;
  for (const user of users) {
    const currentUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { roleAssignments: true },
    });

    const roles = [
      currentUser.primaryRole,
      ...currentUser.roleAssignments.map((r) => r.role),
    ];
    const uniqueRoles = [...new Set(roles)];

    const { snapshots } = await loadBookingSnapshotsForUser({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      phone: currentUser.phone,
      timezone: currentUser.timezone,
      locale: currentUser.locale,
      primaryRole: currentUser.primaryRole,
      roles: uniqueRoles,
    });

    const docs: BookingChunkIndexDoc[] = [];
    for (const snapshot of snapshots) {
      for (const chunk of getBookingChunks(snapshot)) {
        docs.push({
          chunkId: chunk.chunkId,
          bookingId: chunk.bookingId,
          recordType: chunk.recordType,
          participantId: snapshot.participantId,
          organisationId: snapshot.organisationId,
          status: chunk.status,
          title: chunk.title,
          excerpt: chunk.excerpt,
          scheduledStartAt: chunk.scheduledStartAt?.toISOString() ?? null,
        });
      }
    }

    await bulkIndex(docs);
    total += docs.length;
    console.log(`Indexed ${docs.length} chunks for user ${currentUser.id}`);
  }

  console.log(`Done. Total chunks indexed: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
