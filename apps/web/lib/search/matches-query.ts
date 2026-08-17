/** Case-insensitive substring match for labels and keyword lists. */
export function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;
  return text.toLowerCase().includes(q);
}

export function keywordsMatchQuery(keywords: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;
  return keywords.some((kw) => kw.toLowerCase().includes(q));
}
