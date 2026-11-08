import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/day/calendar/route";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiPermission: vi.fn(),
}));

vi.mock("@/lib/calendar/calendar-service", () => ({
  listCalendarEvents: vi.fn(),
}));

const request = (query = "") =>
  new Request(`https://mapable.example/api/day/calendar${query}`);

describe("MapAble Day calendar API permission boundary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T01:00:00Z"));
    vi.stubEnv("MAPABLE_DAY_DEMO_ENABLED", "true");
    vi.stubEnv("MAPABLE_DAY_READ_CALENDAR_ENABLED", "true");
    vi.mocked(requireApiPermission).mockReset();
    vi.mocked(listCalendarEvents).mockReset();
    vi.mocked(requireApiPermission).mockResolvedValue({
      id: "self-participant",
      primaryRole: "participant",
    } as never);
    vi.mocked(listCalendarEvents).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("requires the pre-existing self calendar permission", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(requireApiPermission).toHaveBeenCalledWith("calendar:read:self");
    expect(listCalendarEvents).toHaveBeenCalledWith(
      expect.objectContaining({ participantId: "self-participant" }),
    );
  });

  it("ignores caller-supplied participant ID and never queries another participant", async () => {
    const response = await GET(
      request("?participantId=another-participant&date=2026-11-09"),
    );
    expect(response.status).toBe(200);
    const params = vi.mocked(listCalendarEvents).mock.calls[0]?.[0];
    expect(params?.participantId).toBe("self-participant");
    expect(JSON.stringify(params)).not.toContain("another-participant");
  });

  it("fails closed when the opt-in calendar flag is off", async () => {
    vi.stubEnv("MAPABLE_DAY_READ_CALENDAR_ENABLED", "false");
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(listCalendarEvents).not.toHaveBeenCalled();
  });

  it("does not read anything when existing auth denies access", async () => {
    vi.mocked(requireApiPermission).mockResolvedValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(listCalendarEvents).not.toHaveBeenCalled();
  });

  it("rejects duplicated or invalid date parameters", async () => {
    for (const query of [
      "?date=2026-11-09&date=2026-11-10",
      "?date=2026-02-30",
      "?date=2027-11-09",
    ]) {
      const response = await GET(request(query));
      expect(response.status).toBe(400);
    }
    expect(listCalendarEvents).not.toHaveBeenCalled();
  });

  it("returns minimal unverified records and private no-store headers", async () => {
    vi.mocked(listCalendarEvents).mockResolvedValue([
      {
        id: "example-event",
        title: "Recorded event",
        eventType: "care_shift",
        startAt: new Date("2026-11-09T01:00:00Z"),
        endAt: new Date("2026-11-09T02:00:00Z"),
        description: "SENSITIVE, DO NOT SEND",
      },
    ] as never);
    const response = await GET(request());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(data.readOnly).toBe(true);
    expect(data.events[0].evidenceStatus).toBe("recorded_unverified");
    expect(JSON.stringify(data)).not.toContain("SENSITIVE");
  });

  it("returns an unavailable state without leaking server error details", async () => {
    vi.mocked(listCalendarEvents).mockRejectedValue(new Error("PRIVATE_DB_FAILURE"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("PRIVATE_DB_FAILURE");
  });
});
