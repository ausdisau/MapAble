import { describe, expect, it, vi, beforeEach } from "vitest";

import { prisma } from "@/lib/prisma";
import { searchProviders } from "@/lib/search/provider-autocomplete";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    providerProfile: {
      findMany: vi.fn(),
    },
  },
}));

describe("searchProviders", () => {
  beforeEach(() => {
    vi.mocked(prisma.providerProfile.findMany).mockReset();
  });

  it("returns empty for short query", async () => {
    expect(await searchProviders("a", 5)).toEqual([]);
    expect(prisma.providerProfile.findMany).not.toHaveBeenCalled();
  });

  it("queries visible providers and prefers verified in sort", async () => {
    vi.mocked(prisma.providerProfile.findMany).mockResolvedValue([
      {
        id: "1",
        name: "Visible Provider",
        slug: "visible",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        legacyProviderId: null,
        isVerified: true,
      },
    ] as never);

    const results = await searchProviders("vis", 5);
    expect(results).toHaveLength(1);
    expect(prisma.providerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isSearchVisible: true,
          name: { contains: "vis", mode: "insensitive" },
        }),
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      }),
    );
  });

  it("does not return hidden providers from query results", async () => {
    vi.mocked(prisma.providerProfile.findMany).mockResolvedValue([]);
    const results = await searchProviders("hidden", 5);
    expect(results).toEqual([]);
  });
});
