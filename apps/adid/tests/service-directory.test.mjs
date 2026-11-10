import assert from "node:assert/strict";
import test from "node:test";
import { PUBLIC_SERVICES, claimsOk, verifiedPublicHref } from "../lib/service-directory.ts";

test("public directory has four stable, distinct service entries", () => {
  assert.deepEqual(PUBLIC_SERVICES.map(x => x.id), ["mapable", "accessibooks", "disapedia", "cripsquare"]);
  assert.equal(new Set(PUBLIC_SERVICES.map(x => x.href)).size, 4);
});
test("untrusted URLs cannot become portal links", () => {
  for (const bad of [
    "javascript:alert(1)", "http://mapable.com.au/", "https://mapable.com.au.evil.test/",
    "https://mapable.com.au:444/", "https://user:pass@mapable.com.au/",
    "https://evil.test/", null, undefined, 1,
  ]) assert.equal(verifiedPublicHref(bad), null);
  assert.equal(verifiedPublicHref("https://disapedia.au/"), "https://disapedia.au/");
});
test("claimed identities must include a valid secure issuer and nonempty subject", () => {
  assert.equal(claimsOk("https://issuer.example", "clerk-test-subject"), true);
  assert.equal(claimsOk("http://issuer.example", "x"), false);
  assert.equal(claimsOk("https://issuer.example", ""), false);
  assert.equal(claimsOk("https://username@issuer.example", "x"), false);
});
