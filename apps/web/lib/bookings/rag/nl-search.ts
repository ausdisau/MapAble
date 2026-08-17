import { chunkBookingSnapshot } from "./chunker";
import type { BookingSearchHit, BookingSnapshot } from "./types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "for",
  "is",
  "in",
  "on",
  "at",
  "with",
  "that",
  "this",
  "are",
  "was",
  "and",
  "or",
  "but",
  "find",
  "show",
  "me",
  "my",
  "booking",
  "bookings",
  "about",
  "where",
  "who",
  "which",
  "what",
  "when",
  "status",
  "next",
  "visit",
]);

export function searchBookingSnapshots(
  query: string,
  candidates: BookingSnapshot[],
): BookingSearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0 && query.trim().length < 3) return [];

  const phrase = query.toLowerCase().trim();
  const out: BookingSearchHit[] = [];

  for (const candidate of candidates) {
    const corpus = candidate.searchText.toLowerCase();
    const matched: string[] = [];
    let score = 0;

    for (const term of terms) {
      const count = countOccurrences(corpus, term);
      if (count > 0) {
        matched.push(term);
        score += count;
      }
    }

    if (phrase.length > 4 && corpus.includes(phrase)) {
      score += 3;
      if (!matched.includes(phrase)) matched.push(phrase);
    }

    if (candidate.status === "disputed" || candidate.status === "pending_provider") {
      score += 0.3;
    }

    if (candidate.scheduledStartAt) {
      const daysUntil =
        (candidate.scheduledStartAt.getTime() - Date.now()) / 86400000;
      if (daysUntil >= 0 && daysUntil <= 7) score += 0.5;
    }

    if (score > 0 || terms.length === 0) {
      const chunks = chunkBookingSnapshot(candidate);
      out.push({
        bookingId: candidate.id,
        recordType: candidate.recordType,
        title: candidate.title,
        score: Number(score.toFixed(2)),
        matchedTerms: matched,
        chunks: chunks.slice(0, 5),
      });
    }
  }

  return out.sort((a, b) => b.score - a.score);
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count += 1;
    idx += needle.length;
  }
  return count;
}
