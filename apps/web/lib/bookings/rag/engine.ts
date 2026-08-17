import { bookingRagConfig } from "@/lib/config/booking-rag";

import { chunkBookingSnapshot } from "./chunker";
import { matchesBookingFilters, parseBookingSearchFilters } from "./filters";
import { searchBookingSnapshots } from "./nl-search";
import type {
  BookingChunk,
  BookingRAGEngine,
  BookingSearchFilters,
  BookingSearchHit,
  BookingSnapshot,
} from "./types";

class HybridBookingRAGEngine implements BookingRAGEngine {
  readonly id = bookingRagConfig.engineId;

  search(
    query: string,
    candidates: BookingSnapshot[],
    explicitFilters?: BookingSearchFilters,
  ): BookingSearchHit[] {
    const parsed = parseBookingSearchFilters(query);
    const filters: BookingSearchFilters = {
      ...parsed,
      ...explicitFilters,
    };

    const filtered = candidates.filter((c) => matchesBookingFilters(c, filters));
    const pool = filtered.length > 0 ? filtered : candidates;

    const hits = searchBookingSnapshots(query, pool);
    const limit = bookingRagConfig.defaultResultLimit;
    return hits.slice(0, limit);
  }

  chunk(snapshot: BookingSnapshot): BookingChunk[] {
    return chunkBookingSnapshot(snapshot);
  }
}

let activeEngine: BookingRAGEngine = new HybridBookingRAGEngine();

export function getBookingRAGEngine(): BookingRAGEngine {
  return activeEngine;
}

export function setBookingRAGEngine(engine: BookingRAGEngine): void {
  activeEngine = engine;
}

export function resetBookingRAGEngine(): void {
  activeEngine = new HybridBookingRAGEngine();
}

export function searchBookingsForSnapshots(
  query: string,
  candidates: BookingSnapshot[],
  filters?: BookingSearchFilters,
): BookingSearchHit[] {
  return getBookingRAGEngine().search(query, candidates, filters);
}

export function getBookingChunks(snapshot: BookingSnapshot): BookingChunk[] {
  return getBookingRAGEngine().chunk(snapshot);
}
