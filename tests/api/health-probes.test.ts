import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

describe("health probes", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("GET /api/health/live returns minimal ok with no-store", async () => {
    const { GET } = await import("@/app/api/health/live/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    expect(JSON.stringify(body)).not.toMatch(
      /version|hostname|vercel|neon|postgres|secret|DATABASE|NODE_ENV/i,
    );
  });

  it("live route exports only GET (method restriction)", async () => {
    const mod = await import("@/app/api/health/live/route");
    expect(typeof mod.GET).toBe("function");
    expect(mod).not.toHaveProperty("POST");
    expect(mod).not.toHaveProperty("PUT");
    expect(mod).not.toHaveProperty("DELETE");
  });

  it("GET /api/health/ready returns 200 when database responds", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ status: "ready" });
    expect(JSON.stringify(body)).not.toMatch(
      /postgres|neon|localhost|password|DATABASE|stack|ECONN/i,
    );
  });

  it("GET /api/health/ready returns generic 503 when database fails", async () => {
    queryRaw.mockRejectedValueOnce(
      new Error("connect ECONNREFUSED 127.0.0.1:5432 secret=super-db-pass"),
    );
    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const text = await response.text();
    expect(text).toContain("unavailable");
    expect(text).not.toContain("super-db-pass");
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("127.0.0.1");
  });

  it("GET /api/health/ready returns 503 on dependency timeout", async () => {
    queryRaw.mockImplementationOnce(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );
    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ status: "unavailable" });
    expect(JSON.stringify(body)).not.toMatch(/timeout|prisma|neon/i);
  }, 10_000);

  it("ready route exports only GET and redacts failure details", async () => {
    const mod = await import("@/app/api/health/ready/route");
    expect(typeof mod.GET).toBe("function");
    expect(mod).not.toHaveProperty("POST");
    queryRaw.mockRejectedValueOnce(
      new Error("password=abc host=ep-secret.neon.tech"),
    );
    const response = await mod.GET();
    const text = await response.text();
    expect(text).not.toMatch(/password=|ep-secret|neon\.tech/i);
  });
});
