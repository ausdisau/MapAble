import type { AISummary, CaseSnapshot } from "./types";

const STOP_WORDS = new Set([
  "the",
  "and",
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
  "it",
  "be",
  "are",
  "was",
  "were",
  "by",
  "or",
  "as",
  "from",
  "but",
  "so",
  "if",
  "we",
  "they",
  "their",
  "his",
  "her",
  "him",
]);

/**
 * Pulls the highest-signal sentences out of the case description and most
 * recent notes. This is deliberately a tiny extractive summariser — it
 * never invents facts, so the output can be shown to staff without an
 * "AI hallucination" warning. A real LLM backend would replace this in
 * `engine.ts`.
 */
export function summarise(snapshot: CaseSnapshot): AISummary {
  const sentences = collectSentences(snapshot);
  if (sentences.length === 0) {
    return {
      text:
        snapshot.description ||
        `Case ${snapshot.reference} opened with no descriptive content yet.`,
      highlights: [],
    };
  }

  const wordFreq = buildFrequencyMap(sentences);
  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: scoreSentence(sentence, wordFreq),
    }))
    .sort((a, b) => b.score - a.score);

  const topThree = ranked.slice(0, 3).map((r) => r.sentence.trim());
  const text = composeSummary(snapshot, topThree);

  return {
    text,
    highlights: topThree,
  };
}

function collectSentences(snapshot: CaseSnapshot): string[] {
  const blobs = [snapshot.description, ...snapshot.notes.map((n) => n.body)];
  return blobs
    .flatMap((blob) =>
      blob
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim()),
    )
    .filter((s) => s.length >= 8);
}

function buildFrequencyMap(sentences: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const sentence of sentences) {
    for (const word of tokenize(sentence)) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }
  return freq;
}

function scoreSentence(sentence: string, freq: Map<string, number>): number {
  const words = tokenize(sentence);
  if (words.length === 0) return 0;
  const total = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
  return total / words.length;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function composeSummary(snapshot: CaseSnapshot, highlights: string[]): string {
  const head = `Case ${snapshot.reference} (${snapshot.category}, ${snapshot.priority} priority, status ${snapshot.status}).`;
  if (highlights.length === 0) {
    return `${head} No recent narrative content. AI-generated; verify with the participant.`;
  }
  return `${head} ${highlights.join(" ")} AI-generated extractive summary; verify with the participant.`;
}
