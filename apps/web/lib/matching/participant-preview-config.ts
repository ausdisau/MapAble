/** Synthetic preview is deliberately impossible to enable in production. */
export function isParticipantMatchingPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MAPABLE_PARTICIPANT_WORKER_MATCHING_PREVIEW_ENABLED === "true"
  );
}
