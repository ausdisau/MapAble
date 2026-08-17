import type { MapAbleRequestClient } from "./client";

/** Higher-order JSON helpers composed on MapAbleRequestClient — no second HTTP stack. */

export function getJson<T>(
  client: MapAbleRequestClient,
  path: string,
  init?: RequestInit
): Promise<T> {
  return client.request<T>(path, { ...init, method: init?.method ?? "GET" });
}

export function postJson<T>(
  client: MapAbleRequestClient,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return client.request<T>(path, {
    ...init,
    method: "POST",
    body: body === undefined ? init?.body : JSON.stringify(body),
  });
}

export function patchJson<T>(
  client: MapAbleRequestClient,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return client.request<T>(path, {
    ...init,
    method: "PATCH",
    body: body === undefined ? init?.body : JSON.stringify(body),
  });
}

export interface CursorPage {
  nextCursor?: string | null;
  hasMore?: boolean;
}

/**
 * Drain a cursor-paginated CareOS-style collection.
 * `fetchPage` must accept an optional cursor and return items + page metadata.
 */
export async function fetchAllCursorPages<T>(
  fetchPage: (
    cursor: string | undefined
  ) => Promise<{ items: T[]; page: CursorPage }>
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const { items, page } = await fetchPage(cursor);
    all.push(...items);
    if (!page.hasMore || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}
