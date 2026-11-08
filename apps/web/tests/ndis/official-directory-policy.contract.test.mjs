import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateOfficialDirectoryPublication,
  validateOfficialDirectoryFilters,
} from "../../lib/ndis/platform-adapter/official-directory-policy.ts";

const NOW = new Date("2026-11-08T06:00:00.000Z");
const HASH = "b".repeat(64);
const RUN = {
  sourceUrl: "https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json",
  sourceHash: HASH,
  status: "success",
  startedAt: new Date("2026-11-07T05:00:00.000Z"),
  finishedAt: new Date("2026-11-07T05:08:00.000Z"),
  providerCount: 100,
};
const ENABLED = {
  MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED: "true",
  MAPABLE_NDIS_APPROVED_SOURCE_SHA256: HASH,
};
const evaluate = (run=RUN, env=ENABLED, now=NOW) =>
  evaluateOfficialDirectoryPublication(run, env, now);

test("default disabled, even when a real official data import exists", () => {
  assert.deepEqual(evaluate(RUN, {}), { ready: false, reason: "disabled" });
});

test("requires an operator-approved exact source SHA", () => {
  assert.deepEqual(evaluate(RUN, {
    MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED: "true",
  }), { ready: false, reason: "unapproved_hash" });
  assert.deepEqual(evaluate(RUN, {
    ...ENABLED,
    MAPABLE_NDIS_APPROVED_SOURCE_SHA256: "a".repeat(64),
  }), { ready: false, reason: "unapproved_hash" });
});

test("file fallback and arbitrary URL never pass official-source gate", () => {
  for (const sourceUrl of [
    "file:///tmp/list-providers.json",
    "https://not-ndis.gov.au/path",
    "http://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json",
  ]) {
    assert.deepEqual(evaluate({ ...RUN, sourceUrl }), {
      ready: false, reason: "untrusted_source",
    });
  }
});

test("valid reviewed official data yields labelled, limited read-only evidence", () => {
  const status = evaluate();
  assert.equal(status.ready, true);
  if (!status.ready) throw new Error("Expected approved source");
  assert.equal(status.evidence.officialSourceUrl, RUN.sourceUrl);
  assert.equal(status.evidence.snapshotSha256, HASH);
  assert.equal(status.evidence.providerCountInImport, 100);
  assert.equal(status.evidence.verifiedCurrentRegistration, false);
  assert.equal(status.evidence.verifiedWorkerScreening, false);
  assert.equal(status.evidence.retrievedAt, RUN.finishedAt.toISOString());
});

test("failed or incomplete ingestion never publishes old records", () => {
  assert.deepEqual(evaluate(null), { ready: false, reason: "no_successful_import" });
  assert.deepEqual(evaluate({ ...RUN, status: "failed" }), {
    ready: false, reason: "no_successful_import",
  });
  assert.deepEqual(evaluate({ ...RUN, finishedAt: null }), {
    ready: false, reason: "invalid_import",
  });
  assert.deepEqual(evaluate({ ...RUN, providerCount: 0 }), {
    ready: false, reason: "invalid_import",
  });
});

test("stale 14-day-old and future-dated snapshots cannot be published", () => {
  assert.deepEqual(evaluate(RUN, ENABLED, new Date("2026-12-01T00:00:00.000Z")), {
    ready: false, reason: "stale_import",
  });
  assert.deepEqual(evaluate(RUN, ENABLED, new Date("2026-11-07T05:06:00.000Z")), {
    ready: false, reason: "stale_import",
  });
});

test("provider search needs bounded, purposeful filters", () => {
  assert.deepEqual(validateOfficialDirectoryFilters({ state: "NSW" }), {
    q: "", state: "NSW", postcode: "", page: 1, limit: 15,
  });
  assert.deepEqual(validateOfficialDirectoryFilters({ q: " Care ", page: 2, limit: 20 }), {
    q: "Care", state: "", postcode: "", page: 2, limit: 20,
  });
  for (const bad of [
    {}, { q: "x" }, { q: " ".repeat(90) }, { postcode: "abcd" },
    { q: "Care", page: -1 }, { q: "Care", limit: 1000 },
    { q: "Care", page: 1.5 }, { q: "Care", postcode: "123" },
  ]) {
    assert.throws(() => validateOfficialDirectoryFilters(bad), /INVALID_OFFICIAL_PROVIDER_FILTERS/);
  }
});
