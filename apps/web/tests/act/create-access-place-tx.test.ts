import { describe, expect, it, vi } from "vitest";

const createAuditEvent = vi.fn();
const accessPlaceCreate = vi.fn();

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (args: unknown) => createAuditEvent(args),
}));

vi.mock("@/lib/db/transaction-service", () => ({
  runInTransaction: async <T>(fn: (tx: unknown) => Promise<T>) =>
    fn({
      accessPlace: {
        create: (...args: unknown[]) => accessPlaceCreate(...args),
      },
    }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

describe("createAccessPlace transaction", () => {
  it("writes place and audit through the same tx client", async () => {
    createAuditEvent.mockResolvedValue(undefined);
    accessPlaceCreate.mockResolvedValue({
      id: "place-1",
      name: "Demo",
      location: { latitude: -33.8, longitude: 151.2 },
      features: [],
    });

    const { createAccessPlace } = await import(
      "@/lib/access/map/access-place-service"
    );

    const place = await createAccessPlace({
      input: {
        name: "Demo Place",
        category: "other",
        latitude: -33.8,
        longitude: 151.2,
        country: "AU",
      },
      createdById: "user-1",
    });

    expect(place.id).toBe("place-1");
    expect(accessPlaceCreate).toHaveBeenCalledOnce();
    expect(createAuditEvent).toHaveBeenCalledOnce();
    const call = createAuditEvent.mock.calls[0] as unknown as
      | [Record<string, unknown>]
      | undefined;
    expect(call?.[0]?.entityType).toBe("AccessPlace");
    expect(call?.[0]?.tx).toBeTruthy();
  });
});
