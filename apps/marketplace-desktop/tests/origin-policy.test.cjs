const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveDesktopOrigin, isAllowedDesktopUrl,
} = require("../dist/origin-policy.js");

describe("MapAble Electron alpha desktop origin and security policy", () => {
  it("permits local HTTP only for a development origin", () => {
    const origin = resolveDesktopOrigin({
      value: "http://127.0.0.1:3000", packaged: false, releaseApproved: false,
    });
    assert.equal(origin, "http://127.0.0.1:3000");
    assert.ok(isAllowedDesktopUrl(origin + "/marketplace/design-lab/closed-alpha", origin, true));
    assert.ok(isAllowedDesktopUrl(origin + "/login", origin, true));
  });
  it("refuses unrelated web pages, file URIs, credentialed origins and checkout URLs", () => {
    const origin = "https://alpha.example.org";
    for (const url of [
      "http://alpha.example.org/marketplace/design-lab/closed-alpha",
      "https://evil.example.org/",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "https://alpha.example.org/api/billing/invoices",
      "https://alpha.example.org/marketplace/cart",
      "https://alpha.example.org/checkout",
      "https://user:pass@alpha.example.org/",
    ]) assert.equal(isAllowedDesktopUrl(url, origin), false, url);
  });
  it("blocks packaged mode until exact secure origin and release approval", () => {
    const base = { value: "https://alpha.example.org", packaged: true,
      reviewedOrigin: "https://alpha.example.org" };
    assert.throws(() => resolveDesktopOrigin({ ...base, releaseApproved: false }));
    assert.throws(() => resolveDesktopOrigin({
      ...base, releaseApproved: true, reviewedOrigin: "https://other.example.org",
    }));
    assert.equal(resolveDesktopOrigin({ ...base, releaseApproved: true }),
      "https://alpha.example.org");
  });
  it("rejects remote plain HTTP, trailing path and userinfo", () => {
    for (const value of [
      "http://external.example.org",
      "https://alpha.example.org/different-path",
      "https://user:pass@alpha.example.org/",
      "javascript:alert(1)",
    ]) assert.throws(() => resolveDesktopOrigin({
      value, packaged: false, releaseApproved: false,
    }));
  });
});
