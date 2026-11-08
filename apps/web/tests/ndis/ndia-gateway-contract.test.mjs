import assert from "node:assert/strict";
import test from "node:test";

import {
  assertNdiaTransportNotImplemented,
  getNdiaGatewayReadiness,
  previewNdiaClaimLocally,
} from "../../lib/ndis/api-gateway/ndia-gateway-contract.ts";

const synthetic = {
  NODE_ENV: "test",
  MAPABLE_NDIA_ADAPTER_SYNTHETIC_ENABLED: "true",
};

const example = {
  synthetic: true,
  testCaseId: "demo_example01",
  lineCount: 2,
  totalCents: 20000,
};

test("default gateway is disabled and does not claim approved access", () => {
  const status = getNdiaGatewayReadiness({});
  assert.equal(status.mode, "disabled");
  assert.equal(status.accessEvidence, "not_independently_verified");
  assert.equal(status.canTransmit, false);
  assert.equal(status.participantDataAccess, false);
  assert.equal(status.productionApproved, false);
});

test("synthetic mode is explicitly opt-in and produces no NDIA reference", () => {
  const preview = previewNdiaClaimLocally(example, synthetic);
  assert.equal(preview.notSubmitted, true);
  assert.equal(preview.governmentReference, null);
  assert.equal(preview.result, "local_validation_only");
});

test("production blocks synthetic even when flags are enabled", () => {
  const env = {
    ...synthetic,
    NODE_ENV: "production",
    NDIA_REAL_SUBMISSION_ENABLED: "true",
  };
  const status = getNdiaGatewayReadiness(env);
  assert.equal(status.mode, "production_preview_blocked");
  assert.equal(status.canTransmit, false);
  assert.equal(status.legacySubmissionFlagObserved, true);
  assert.throws(
    () => previewNdiaClaimLocally(example, env),
    /NDIA_SYNTHETIC_PREVIEW_DISABLED/,
  );
});

test("flag cannot authorise real NDIA transport", () => {
  assert.throws(
    () => assertNdiaTransportNotImplemented(),
    /NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED/,
  );
});

test("rejects real or excess identity and credential fields", () => {
  for (const extra of [
    { participantNumber: "not-to-be-used" },
    { apiToken: "do-not-use" },
    { invoiceJson: {} },
    { organisationId: "org" },
  ]) {
    assert.throws(
      () => previewNdiaClaimLocally({ ...example, ...extra }, synthetic),
      /NDIA_SYNTHETIC_FIELDS_ONLY/,
    );
  }
});

test("rejects non-fictional identifiers and arbitrary payloads", () => {
  assert.throws(
    () => previewNdiaClaimLocally({ ...example, testCaseId: "real-claim-123" }, synthetic),
    /NDIA_SYNTHETIC_PAYLOAD_INVALID/,
  );
  assert.throws(
    () => previewNdiaClaimLocally([example], synthetic),
    /NDIA_SYNTHETIC_INPUT_REQUIRED/,
  );
  assert.throws(
    () => previewNdiaClaimLocally({ ...example, synthetic: false }, synthetic),
    /NDIA_SYNTHETIC_PAYLOAD_INVALID/,
  );
});

test("rejects invalid money and line quantities", () => {
  for (const value of [
    { totalCents: -1 },
    { totalCents: Number.NaN },
    { totalCents: 123.25 },
    { lineCount: 0 },
    { lineCount: Number.MAX_SAFE_INTEGER },
  ]) {
    assert.throws(
      () => previewNdiaClaimLocally({ ...example, ...value }, synthetic),
      /NDIA_SYNTHETIC_PAYLOAD_INVALID/,
    );
  }
});

test("adapter makes no network request", () => {
  const before = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("UNEXPECTED_NDIA_NETWORK_REQUEST");
  };
  try {
    const result = previewNdiaClaimLocally(example, synthetic);
    assert.equal(result.notSubmitted, true);
    assert.equal(getNdiaGatewayReadiness(synthetic).canTransmit, false);
  } finally {
    globalThis.fetch = before;
  }
});
