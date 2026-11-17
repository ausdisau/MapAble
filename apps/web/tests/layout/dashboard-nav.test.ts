import { describe, expect, it } from "vitest";

import { buildDashboardNavGroups } from "@/components/layout/DashboardNav";

describe("dashboard nav groups", () => {
  it("groups participant workspace links and keeps Explore MapAble", () => {
    const groups = buildDashboardNavGroups({
      role: "participant",
      showCareOsNav: false,
    });
    expect(groups.map((group) => group.id)).toEqual([
      "workspace",
      "discover",
      "activity",
      "safety",
    ]);
    const discover = groups.find((group) => group.id === "discover");
    expect(discover?.links.some((link) => link.href === "/")).toBe(true);
    expect(groups.some((group) => group.id === "admin")).toBe(false);
  });

  it("adds CareOS and admin groups only when applicable", () => {
    const withCareOs = buildDashboardNavGroups({
      role: "participant",
      showCareOsNav: true,
    });
    expect(withCareOs.some((group) => group.id === "careos")).toBe(true);

    const admin = buildDashboardNavGroups({
      role: "mapable_admin",
      showCareOsNav: false,
    });
    expect(admin.some((group) => group.id === "admin")).toBe(true);
  });
});
