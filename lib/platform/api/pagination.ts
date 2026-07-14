export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CursorParams = {
  cursor?: string | null;
  limit?: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export function parseCursorParams(
  searchParams: URLSearchParams,
): Required<CursorParams> {
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );
  return {
    cursor: searchParams.get("cursor"),
    limit,
  };
}

export function encodeCursor(id: string, createdAt: Date): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [iso, id] = decoded.split("|");
    if (!iso || !id) return null;
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export function buildCursorPage<T extends { id: string; createdAt: Date }>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.id, last.createdAt) : null,
  };
}
