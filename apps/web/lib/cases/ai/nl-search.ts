import type { AISearchHit, CaseSnapshot } from "./types";

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
  "case",
  "cases",
  "about",
  "where",
  "who",
  "which",
  "what",
]);

/**
 * Lightweight natural-language search over cases.
 *
 * Tokenises the query (stripping stop-words and a couple of intent verbs),
 * then scores each candidate by a tf-style match against title,
 * description, notes, tags and task titles. Boosts exact phrase matches.
 * This is enough for "show me cases about housing" style queries and
 * gives a deterministic baseline that a vector backend can replace.
 */
export function searchCases(
  query: string,
  candidates: CaseSnapshot[],
): AISearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const phrase = query.toLowerCase().trim();
  const out: AISearchHit[] = [];

  for (const candidate of candidates) {
    const corpus = buildCorpus(candidate);
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

    if (candidate.priority === "urgent") score += 0.5;
    if (candidate.riskLevel === "high" || candidate.riskLevel === "critical") {
      score += 0.5;
    }

    if (score > 0) {
      out.push({
        caseId: candidate.id,
        reference: candidate.reference,
        title: candidate.title,
        score: Number(score.toFixed(2)),
        matchedTerms: matched,
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

function buildCorpus(snapshot: CaseSnapshot): string {
  return [
    snapshot.title,
    snapshot.description,
    snapshot.category,
    snapshot.status,
    ...snapshot.tags,
    ...snapshot.notes.map((n) => n.body),
    ...snapshot.tasks.map((t) => t.title),
  ]
    .join(" \n ")
    .toLowerCase();
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
