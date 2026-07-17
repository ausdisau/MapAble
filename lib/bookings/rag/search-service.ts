import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { searchBookingsForSnapshots, getBookingChunks } from "./engine";
import { explainBookingStatus } from "./explain-status";
import {
  loadBookingSnapshotById,
  loadBookingSnapshotsForUser,
} from "./snapshot-loader";
import type {
  BookingSearchFilters,
  BookingSearchHit,
  BookingSnapshot,
  BookingStatusExplanation,
} from "./types";

export async function searchScopedBookings(
  user: CurrentUser,
  query: string,
  filters?: BookingSearchFilters,
): Promise<{ hits: BookingSearchHit[]; totalCandidates: number }> {
  const { snapshots } = await loadBookingSnapshotsForUser(user);
  const hits = searchBookingsForSnapshots(query, snapshots, filters);

  void createAuditEvent({
    actorUserId: user.id,
    action: "booking_rag.search",
    entityType: "BookingRAG",
    entityId: user.id,
    participantId: user.id,
    metadata: {
      query: query.slice(0, 200),
      hitCount: hits.length,
      candidateCount: snapshots.length,
    },
  });

  return { hits, totalCandidates: snapshots.length };
}

export async function getScopedBookingContext(
  user: CurrentUser,
  bookingId: string,
): Promise<{ snapshot: BookingSnapshot; chunks: ReturnType<typeof getBookingChunks> } | null> {
  const snapshot = await loadBookingSnapshotById(user, bookingId);
  if (!snapshot) return null;

  void createAuditEvent({
    actorUserId: user.id,
    action: "booking_rag.context",
    entityType: snapshot.recordType === "care" ? "CareBooking" : "Booking",
    entityId: bookingId,
    participantId: snapshot.participantId,
    organisationId: snapshot.organisationId ?? undefined,
    metadata: { recordType: snapshot.recordType },
  });

  return {
    snapshot,
    chunks: getBookingChunks(snapshot),
  };
}

export async function explainScopedBookingStatus(
  user: CurrentUser,
  bookingId: string,
): Promise<BookingStatusExplanation | null> {
  const snapshot = await loadBookingSnapshotById(user, bookingId);
  if (!snapshot) return null;

  return explainBookingStatus({
    bookingId: snapshot.id,
    recordType: snapshot.recordType,
    status: snapshot.status,
  });
}
