import assert from "node:assert/strict";
import test from "node:test";

import {
  getNdisPlatformAdapterStatus,
  previewSyntheticNdisJourney,
} from "../../lib/ndis/platform-adapter/ndis-platform-adapter.ts";

const enabled = {
  NODE_ENV: "test",
  MAPABLE_NDIS_PLATFORM_ADAPTER_PREVIEW_ENABLED: "true",
};
const demo = {
  synthetic: true,
  scenarioId: "demo_support_01",
  support: "daily_living",
  communication: "aac",
  requestedHumanAssistance: true,
};

test("disabled by default; no government or worker approval implied", () => {
  const status = getNdisPlatformAdapterStatus({});
  assert.equal(status.mode, "disabled");
  assert.equal(status.verifiedPlatformRegistration, false);
  assert.equal(status.verifiedNDIAConnection, false);
  assert.equal(status.canSubmitClaim, false);
  assert.equal(status.canAssignWorker, false);
  assert.equal(status.canDetermineEligibility, false);
  assert.equal(status.lanes.length, 4);
});

test("provider registration and worker screening are independent", () => {
  const status = getNdisPlatformAdapterStatus(enabled);
  assert.equal(status.lanes.find((x) => x.id === "public_provider_directory")?.evidence, "public_directory_reference_only");
  assert.equal(status.lanes.find((x) => x.id === "worker_screening")?.evidence, "authorised_portal_required");
  assert.ok(status.lanes.every((x) => !x.allowsIndividualWorkerClearanceDecision));
  assert.ok(status.lanes.every((x) => !x.allowsRealTransaction));
});

test("fictional preview cannot book, claim, infer authority or clear a worker", () => {
  const result = previewSyntheticNdisJourney(demo, enabled);
  assert.equal(result.booking, "not_created");
  assert.equal(result.ndiaClaim, "not_submitted");
  assert.equal(result.providerRegistration, "not_checked");
  assert.equal(result.workerScreening, "not_independently_verified");
  assert.equal(result.participantAuthority, "not_established");
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.communication, "aac");
});

test("production hard blocks preview even if flag is true", () => {
  const env = { ...enabled, NODE_ENV: "production" };
  assert.equal(getNdisPlatformAdapterStatus(env).mode, "production_preview_blocked");
  assert.throws(() => previewSyntheticNdisJourney(demo, env), /PREVIEW_DISABLED/);
});

test("old NDIA submission flag cannot enable transactions", () => {
  const status = getNdisPlatformAdapterStatus({
    ...enabled, NDIA_REAL_SUBMISSION_ENABLED: "true",
  });
  assert.equal(status.ndiaLegacySubmissionFlagObserved, true);
  assert.equal(status.canSubmitClaim, false);
});

test("private identity, clinical, billing and credential fields are rejected", () => {
  for (const extra of [
    { participantNumber: "1234" },
    { workerId: "a" },
    { providerAbn: "123" },
    { invoiceId: "invoice" },
    { diagnosis: "not permitted" },
    { apiToken: "secret" },
  ]) {
    assert.throws(
      () => previewSyntheticNdisJourney({ ...demo, ...extra }, enabled),
      /SYNTHETIC_FIELDS_ONLY/,
    );
  }
});

test("unsupported and real scenario inputs fail closed", () => {
  for (const value of [
    { ...demo, scenarioId: "real_1234" },
    { ...demo, synthetic: false },
    { ...demo, communication: "capacity_assessment" },
    { ...demo, requestedHumanAssistance: "yes" },
  ]) {
    assert.throws(() => previewSyntheticNdisJourney(value, enabled), /SYNTHETIC_PAYLOAD_INVALID/);
  }
  assert.throws(() => previewSyntheticNdisJourney([demo], enabled), /SYNTHETIC_INPUT_REQUIRED/);
});

test("adapter requires no network requests", () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw Error("UNEXPECTED_NDIS_NETWORK_REQUEST"); };
  try {
    assert.equal(previewSyntheticNdisJourney(demo, enabled).ndiaClaim, "not_submitted");
    assert.equal(getNdisPlatformAdapterStatus(enabled).canAssignWorker, false);
  } finally {
    globalThis.fetch = original;
  }
});
