export type BookingRecordType = "care" | "transport" | "bundle";

export type BookingEventSnapshot = {
  id: string;
  eventType: string;
  title: string;
  createdAt: Date;
};

export type BookingServiceLogSnapshot = {
  id: string;
  status: string;
  notes: string | null;
  durationMinutes: number | null;
  submittedAt: Date | null;
  confirmedAt: Date | null;
  disputedAt: Date | null;
};

export type BookingSegmentSnapshot = {
  id: string;
  segmentType: string;
  startTime: Date | null;
  endTime: Date | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
};

/**
 * Minimal booking projection for retrieval — decoupled from Prisma rows
 * so the engine can be unit-tested with plain objects.
 */
export interface BookingSnapshot {
  id: string;
  recordType: BookingRecordType;
  status: string;
  participantId: string;
  organisationId: string | null;
  organisationName: string | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  location: string | null;
  title: string;
  summary: string;
  searchText: string;
  createdAt: Date;
  updatedAt: Date;
  events: BookingEventSnapshot[];
  serviceLogs: BookingServiceLogSnapshot[];
  segments: BookingSegmentSnapshot[];
  /** Whether accessibility/mobility detail may appear in chunks */
  includeSensitiveFields: boolean;
}

export type BookingChunkSourceType =
  | "summary"
  | "event"
  | "service_log"
  | "segment"
  | "timeline";

export interface BookingChunk {
  chunkId: string;
  bookingId: string;
  recordType: BookingRecordType;
  sourceType: BookingChunkSourceType;
  sourceId: string;
  title: string;
  excerpt: string;
  status: string;
  scheduledStartAt: Date | null;
  organisationName: string | null;
}

export interface BookingSearchHit {
  bookingId: string;
  recordType: BookingRecordType;
  title: string;
  score: number;
  matchedTerms: string[];
  chunks: BookingChunk[];
}

export type BookingSearchFilters = {
  recordType?: BookingRecordType;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  organisationId?: string;
};

export interface BookingStatusExplanation {
  bookingId: string;
  recordType: BookingRecordType;
  status: string;
  summary: string;
  nextSteps: string[];
  participantActions: string[];
  providerActions: string[];
}

/**
 * Pluggable retrieval engine — default is hybrid TF + filters; vector/OpenSearch
 * backends can implement the same contract.
 */
export interface BookingRAGEngine {
  readonly id: string;
  search(
    query: string,
    candidates: BookingSnapshot[],
    filters?: BookingSearchFilters,
  ): BookingSearchHit[];
  chunk(snapshot: BookingSnapshot): BookingChunk[];
}

export type BookingRAGScope = {
  participantId?: string;
  organisationIds?: string[];
  isAdmin: boolean;
  viewerUserId: string;
  viewerRole: string;
};
