import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("/jobs → /employment compatibility redirect", () => {
  it("configures a permanent redirect from /jobs to /employment", async () => {
    const redirects = nextConfig.redirects
      ? await nextConfig.redirects()
      : [];
    const jobsRedirect = redirects.find((r) => r.source === "/jobs");
    expect(jobsRedirect).toBeDefined();
    expect(jobsRedirect?.destination).toBe("/employment");
    expect(jobsRedirect?.permanent).toBe(true);
  });
});
