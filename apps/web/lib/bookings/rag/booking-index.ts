/** OpenSearch index mapping for booking RAG chunks (keyword replica). */

export const BOOKING_CHUNK_INDEX_V1 = "mapable_booking_chunks_v1";

export const BOOKING_CHUNK_INDEX_BODY = {
  settings: {
    analysis: {
      analyzer: {
        booking_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      chunkId: { type: "keyword" },
      bookingId: { type: "keyword" },
      recordType: { type: "keyword" },
      participantId: { type: "keyword" },
      organisationId: { type: "keyword" },
      status: { type: "keyword" },
      title: {
        type: "text",
        analyzer: "booking_text",
        fields: { keyword: { type: "keyword" } },
      },
      excerpt: { type: "text", analyzer: "booking_text" },
      scheduledStartAt: { type: "date" },
    },
  },
} as const;

export const BOOKING_CHUNK_SEARCH_FIELDS = ["title^3", "excerpt^2", "status"];

export type BookingChunkIndexDoc = {
  chunkId: string;
  bookingId: string;
  recordType: string;
  participantId: string;
  organisationId: string | null;
  status: string;
  title: string;
  excerpt: string;
  scheduledStartAt: string | null;
};
