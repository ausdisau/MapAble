import { describe, expect, it } from "vitest";

import {
  getLaunchCommand,
  isWorkspaceRouterEnabled,
  WORKSPACE_REPO,
  WORKSPACE_TARGETS,
} from "../lib/workspace/targets";

describe("Unified Workspace router boundaries", () => {
  it("stays disabled unless explicitly enabled", () => {
    for (const value of [undefined, "", "false", "1", "TRUE"]) {
      expect(isWorkspaceRouterEnabled(value)).toBe(false);
    }
    expect(isWorkspaceRouterEnabled("true")).toBe(true);
  });

  it("uses the current canonical repository and isolated app roots", () => {
    expect(WORKSPACE_REPO.canonical).toBe("ausdisau/MapAble");
    expect(WORKSPACE_TARGETS.map((target) => target.directory)).toEqual([
      "apps/web",
      "apps/mobile",
    ]);
  });

  it("shows only known commands and rejects arbitrary target identifiers", () => {
    expect(getLaunchCommand("web")).toBe("pnpm dev:web");
    expect(getLaunchCommand("mobile")).toBe("npm run dev:mobile");
    expect(getLaunchCommand("../../../etc/passwd")).toBeNull();
    expect(getLaunchCommand("web; rm -rf /")).toBeNull();
    expect(getLaunchCommand(undefined)).toBeNull();
  });

  it("does not expose a mobile tunnel, secret, or fake process states", () => {
    const text = JSON.stringify(WORKSPACE_TARGETS);
    expect(text).not.toContain("start:tunnel");
    expect(text).not.toContain("API_KEY");
    expect(text).not.toContain("running");
  });
});
