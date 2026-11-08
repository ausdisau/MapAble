import test from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_CRITERIA,
  FICTIONAL_WORKERS,
  reviewFictionalWorker,
} from "../../lib/matching/participant-preview.ts";

const worker = FICTIONAL_WORKERS[0];

test("fictional clearance is never independently verified", () => {
  const result = reviewFictionalWorker(EMPTY_CRITERIA, worker);
  assert.equal(result.screeningLabel, "Clearance");
  assert.equal(result.verifiedScreening, false);
  assert.equal(result.verifiedCompetence, false);
  assert.equal(result.confirmedAvailability, false);
  assert.equal(result.canBook, false);
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.synthetic, true);
});

for (const status of ["Interim bar", "Exclusion", "Suspension", "No valid clearance"]) {
  test("restricted fictional status is not progressed: " + status, () => {
    const result = reviewFictionalWorker(EMPTY_CRITERIA, {
      ...worker, fictionalScreening: status,
    });
    assert.equal(result.discussionOnly, false);
    assert.equal(result.factors.find((factor) => factor.topic === "Worker screening")?.state, "blocked");
    assert.equal(result.canBook, false);
  });
}

for (const status of ["Pending", "Clearance", "Not independently verified"]) {
  test("screening remains unverified for fictional status: " + status, () => {
    const result = reviewFictionalWorker(EMPTY_CRITERIA, {
      ...worker, fictionalScreening: status,
    });
    assert.equal(result.verifiedScreening, false);
    assert.equal(result.canBook, false);
  });
}

test("participant exclusion takes priority", () => {
  const result = reviewFictionalWorker({
    ...EMPTY_CRITERIA,
    excludedWorkerIds: [worker.id],
  }, worker);
  assert.equal(result.discussionOnly, false);
});

test("unknown communication access is not treated as established compatibility", () => {
  const result = reviewFictionalWorker({
    ...EMPTY_CRITERIA, communicationNeeds: ["auslan"],
  }, worker);
  assert.equal(result.factors.find((factor) => factor.topic === "Communication access")?.state, "unknown");
});

test("high-intensity requirements need competency confirmation", () => {
  const result = reviewFictionalWorker({
    ...EMPTY_CRITERIA, requiredCompetencies: ["high_intensity"],
  }, worker);
  assert.equal(result.factors.find((factor) => factor.topic === "Competencies")?.state, "needs_confirmation");
});

test("fictional window cannot prove availability", () => {
  const result = reviewFictionalWorker({
    ...EMPTY_CRITERIA, preferredWindow: "weekday_morning",
  }, worker);
  assert.equal(result.confirmedAvailability, false);
});

test("continuity is participant-identified only", () => {
  const none = reviewFictionalWorker(EMPTY_CRITERIA, worker);
  const chosen = reviewFictionalWorker({
    ...EMPTY_CRITERIA, familiarWorkerIds: [worker.id],
  }, worker);
  assert.equal(none.factors.find((f) => f.topic === "Continuity")?.state, "not_requested");
  assert.equal(chosen.factors.find((f) => f.topic === "Continuity")?.state, "fictional_only");
});
