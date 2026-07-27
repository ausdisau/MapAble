import { describe, expect, it } from "vitest";

import {
  buildCursorPage,
  decodeCursor,
  encodeCursor,
} from "@/lib/platform/api/pagination";
import { apiErrorResponse } from "@/lib/platform/api/errors";

describe("API v1 contracts", () => {
  it("encodes and decodes cursors", () => {
    const createdAt = new Date("2026-07-14T12:00:00.000Z");
    const cursor = encodeCursor("abc123", createdAt);
    const decoded = decodeCursor(cursor);
    expect(decoded?.id).toBe("abc123");
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("builds cursor pages with hasMore", () => {
    const rows = [
      { id: "1", createdAt: new Date() },
      { id: "2", createdAt: new Date() },
      { id: "3", createdAt: new Date() },
    ];
    const page = buildCursorPage(rows, 2);
    expect(page.items).toHaveLength(2);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBeTruthy();
  });

  it("returns structured error shape", async () => {
    const res = apiErrorResponse("scope_denied", "Missing scope", 403, {
      scope: "places_read",
    });
    const body = await res.json();
    expect(body.error.code).toBe("scope_denied");
    expect(body.error.details?.scope).toBe("places_read");
    expect(res.status).toBe(403);
  });
});
