import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadNdisListProviders,
  parseNdisListProvidersJson,
  resolveNdisListProvidersPath,
} from "@/lib/ndis/list-providers-source";

describe("loadNdisListProviders", () => {
  it("loads bundled public provider-outlets.json", async () => {
    const path = resolveNdisListProvidersPath(
      join(process.cwd(), "public", "data", "provider-outlets.json"),
    );
    const file = await loadNdisListProviders(path);
    expect(file.data.length).toBeGreaterThan(70_000);
    expect(file.date).toBeTruthy();
    expect(file.data[0]?.ABN).toBeTruthy();
  });

  it("parses a top-level array fixture", async () => {
    const fixture = join(
      process.cwd(),
      "tests",
      "fixtures",
      "ndis-list-providers-array.json",
    );
    const raw = await readFile(fixture, "utf8");
    const file = parseNdisListProvidersJson(raw);
    expect(file.data).toHaveLength(1);
    expect(file.data[0]?.ABN).toBe("123");
  });
});
