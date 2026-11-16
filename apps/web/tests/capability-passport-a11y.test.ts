import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Capability Passport v1 accessibility smoke", () => {
  it("worker and assessor surfaces expose live regions, large targets and Easy Read", () => {
    const worker = read(
      "app/dashboard/worker/capability-passport/CapabilityPassportClient.tsx",
    );
    const assessor = read(
      "app/admin/ops/safeguarding/capability-review/CapabilityReviewQueue.tsx",
    );
    const page = read("app/dashboard/worker/capability-passport/page.tsx");
    expect(worker).toMatch(/aria-live="polite"/);
    expect(worker).toMatch(/Easy Read/);
    expect(worker).toMatch(/size="lg"/);
    expect(worker).toMatch(/motion-reduce/);
    expect(assessor).toMatch(/aria-live="polite"/);
    expect(assessor).toMatch(/size="lg"/);
    expect(page).toMatch(/Training completed is not demonstrated competence/);
    expect(page).toMatch(/not a general safety guarantee/);
  });
});
