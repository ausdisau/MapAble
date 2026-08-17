import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";

export function scoreTextAgainstQuery(
  parts: string[],
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return 0;

  let score = 0;
  const words = q.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === q) score += 10;
    else if (lower.startsWith(q)) score += 6;
    else if (textMatchesQuery(part, q)) score += 3;
    else if (keywordsMatchQuery([part], q)) score += 2;
  }

  for (const word of words) {
    if (word.length < 2) continue;
    for (const part of parts) {
      if (part.toLowerCase().includes(word)) score += 1;
    }
  }

  return score;
}
