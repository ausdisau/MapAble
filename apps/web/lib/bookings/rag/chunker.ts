import type { BookingChunk, BookingSnapshot } from "./types";

const MAX_EXCERPT = 600;

function trimExcerpt(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_EXCERPT) return normalized;
  return `${normalized.slice(0, MAX_EXCERPT - 1)}…`;
}

export function chunkBookingSnapshot(snapshot: BookingSnapshot): BookingChunk[] {
  const chunks: BookingChunk[] = [];

  const base = {
    bookingId: snapshot.id,
    recordType: snapshot.recordType,
    status: snapshot.status,
    scheduledStartAt: snapshot.scheduledStartAt,
    organisationName: snapshot.organisationName,
  };

  chunks.push({
    ...base,
    chunkId: `${snapshot.id}:summary`,
    sourceType: "summary",
    sourceId: snapshot.id,
    title: snapshot.title,
    excerpt: trimExcerpt(snapshot.summary),
  });

  for (const event of snapshot.events) {
    chunks.push({
      ...base,
      chunkId: `${snapshot.id}:event:${event.id}`,
      sourceType: "event",
      sourceId: event.id,
      title: event.title,
      excerpt: trimExcerpt(
        `${event.eventType} — ${event.title} (${event.createdAt.toISOString().slice(0, 10)})`,
      ),
    });
  }

  for (const log of snapshot.serviceLogs) {
    const parts = [
      `Service log ${log.status}`,
      log.durationMinutes ? `${log.durationMinutes} minutes` : null,
      log.notes,
    ].filter(Boolean);
    chunks.push({
      ...base,
      chunkId: `${snapshot.id}:log:${log.id}`,
      sourceType: "service_log",
      sourceId: log.id,
      title: `Service log (${log.status})`,
      excerpt: trimExcerpt(parts.join(". ")),
    });
  }

  for (const segment of snapshot.segments) {
    const parts = [
      segment.segmentType,
      segment.pickupAddress,
      segment.dropoffAddress,
      segment.startTime?.toISOString(),
      segment.endTime?.toISOString(),
    ].filter(Boolean);
    chunks.push({
      ...base,
      chunkId: `${snapshot.id}:segment:${segment.id}`,
      sourceType: "segment",
      sourceId: segment.id,
      title: `${segment.segmentType} segment`,
      excerpt: trimExcerpt(parts.join(" · ")),
    });
  }

  return chunks;
}
