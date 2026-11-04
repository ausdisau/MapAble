import { describe, expect, it } from "vitest";

import { isSafeInternalRedirectPath } from "@/lib/auth/safe-internal-redirect";

describe("isSafeInternalRedirectPath", () => {
  it("allows app-local routes", () => {
    for (const value of ["/", "/dashboard", "/care?tab=bookings#upcoming"]) {
      expect(isSafeInternalRedirectPath(value)).toBe(true);
    }
  });

  it("blocks off-origin and malformed redirect targets", () => {
    for (const value of [
      "",
      "https://external.example/path",
      "//external.example/path",
      "/\\external.example/path",
      "/\\\\external.example/path",
      "\\\\external.example",
      "dashboard",
      "/dashboard\nnext",
      "/dashboard\rnext",
      "/dashboard\u0000next",
      "/dashboard\u007fnext",
    ]) {
      expect(isSafeInternalRedirectPath(value)).toBe(false);
    }
  });
});
