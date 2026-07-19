import { expect, test } from "@playwright/test";

/**
 * Golden browser journey for Taylor @ Harbour Civic Centre.
 * Requires:
 *   MAPABLE_STARTING_WORK_PILOT_ENABLED=true
 *   MAPABLE_STARTING_WORK_SYNTHETIC_ONLY=true
 * Optional:
 *   MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED=true
 */
test.describe("Starting Work golden browser journey", () => {
  test("shows baseline Taylor walkthrough steps and dependency graph", async ({
    page,
  }) => {
    const res = await page.goto("/pilot/starting-work");
    // Pilot may be disabled in default CI — skip honestly rather than fake pass.
    if (res?.status() === 200) {
      const disabled = await page
        .getByText("Pilot is disabled")
        .isVisible()
        .catch(() => false);
      test.skip(disabled, "Starting Work pilot flags are off in this environment");
    }

    await expect(page.getByRole("heading", { name: /Starting Work/i })).toBeVisible();
    await expect(page.getByTestId("participant-goal")).toContainText(
      "Harbour Civic Centre",
    );
    await expect(page.getByTestId("step-care_authorised")).toBeVisible();
    await expect(page.getByTestId("step-transport_authorised")).toBeVisible();
    await expect(page.getByTestId("step-door_to_room_preflight")).toBeVisible();
    await expect(page.getByTestId("step-visit_pack_compiled")).toBeVisible();
    await expect(page.getByTestId("step-outcome_reviewed")).toBeVisible();
    await expect(page.getByTestId("step-invoice_created")).toBeVisible();
    await expect(page.getByTestId("regional-confirmed")).toContainText("0");
    await expect(page.getByTestId("dependency-graph")).toBeVisible();
  });

  test("simulate expired consent fails closed", async ({ page }) => {
    await page.goto("/pilot/starting-work");
    const disabled = await page
      .getByText("Pilot is disabled")
      .isVisible()
      .catch(() => false);
    test.skip(disabled, "Starting Work pilot flags are off in this environment");

    await page.getByTestId("run-failure-expired_consent").click();
    await expect(page.getByTestId("simulate-result")).toContainText(
      "expired_consent",
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("simulate-result")).toContainText(
      '"blocked": true',
    );
  });

  test("simulate inaccessible vehicle blocks transport authorisation", async ({
    page,
  }) => {
    await page.goto("/pilot/starting-work");
    const disabled = await page
      .getByText("Pilot is disabled")
      .isVisible()
      .catch(() => false);
    test.skip(disabled, "Starting Work pilot flags are off in this environment");

    await page.getByTestId("run-failure-inaccessible_vehicle").click();
    await expect(page.getByTestId("simulate-result")).toContainText(
      "inaccessible_vehicle",
      { timeout: 15_000 },
    );
  });
});
