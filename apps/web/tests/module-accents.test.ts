import { describe, expect, it } from "vitest";

import { modules } from "@/app/lib/modules";
import { moduleAccentClass, moduleAccentStyles } from "@/lib/brand/module-accents";

describe("module accents", () => {
  it("defines primary, secondary, and brand accent styles", () => {
    expect(Object.keys(moduleAccentStyles).sort()).toEqual(["brand", "primary", "secondary"]);
    expect(moduleAccentClass("primary").linkClass).toContain("text-primary");
    expect(moduleAccentClass("secondary").linkClass).toContain("text-secondary");
  });

  it("assigns accents to all modules without legacy color fields", () => {
    for (const module of modules) {
      expect(["primary", "secondary", "brand"]).toContain(module.accent);
      expect("color" in module).toBe(false);
      expect("gradient" in module).toBe(false);
    }
  });
});
