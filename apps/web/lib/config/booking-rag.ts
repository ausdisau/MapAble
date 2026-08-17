/** Booking RAG retrieval engine configuration. */

export const bookingRagConfig = {
  engineId: process.env.BOOKING_RAG_ENGINE_ID ?? "hybrid-v1",
  defaultResultLimit: Math.min(
    Math.max(Number(process.env.BOOKING_RAG_RESULT_LIMIT ?? "8"), 1),
    25,
  ),
  snapshotLimit: Math.min(
    Math.max(Number(process.env.BOOKING_RAG_SNAPSHOT_LIMIT ?? "100"), 10),
    200,
  ),
} as const;
