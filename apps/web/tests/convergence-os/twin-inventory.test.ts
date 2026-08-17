import { describe, expect, it } from "vitest";
import { buildTwinInventory } from "@/lib/platform/convergence-os/twin/inventory";

describe("Repository twin inventory", () => {
  it("builds package/module/route/flag inventories with hashes", () => {
    const inventory = buildTwinInventory();
    expect(inventory.packages.length).toBeGreaterThan(0);
    expect(inventory.modules.length).toBeGreaterThan(0);
    expect(inventory.routes.length).toBeGreaterThan(0);
    expect(inventory.hashes.packageGraphHash).toMatch(/^[a-f0-9]+$/);
    expect(inventory.hashes.routeGraphHash).toMatch(/^[a-f0-9]+$/);
    expect(
      inventory.graphEdges.every((e) => e.edgeType === "implements")
    ).toBe(true);
  });
});
