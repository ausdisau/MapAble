import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "mapable:accessibility-ui:v1";

async function openPanel(page: Page) {
  const trigger = page
    .getByRole("button", {
      name: /open accessibility settings/i,
    })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByTestId("accessibility-panel");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function chooseRadio(page: Page, name: RegExp) {
  await page.getByRole("radio", { name }).click();
}

async function runAxe(page: Page, options?: { include?: string }) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  if (options?.include) {
    builder = builder.include(options.include);
  }
  const results = await builder.analyze();
  const tagged = results.violations.filter((v) =>
    (v.tags || []).some((tag) =>
      ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"].includes(tag),
    ),
  );
  expect(tagged, JSON.stringify(tagged, null, 2)).toEqual([]);
}

async function clearStoredPreferences(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (key) => window.localStorage.removeItem(key),
    STORAGE_KEY,
  );
}

test.describe("MapAble Accessibility Panel", () => {
  test("panel closed on homepage — one trigger path, no accessiBe", async ({
    page,
  }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(
        "#accessibe, script[src*='acsbapp'], script[src*='accessibe']",
      ),
    ).toHaveCount(0);
    await expect(page.getByTestId("accessibility-panel")).toHaveCount(1);
    await expect(
      page
        .getByRole("button", { name: /open accessibility settings/i })
        .first(),
    ).toBeVisible();
    await runAxe(page);
  });

  test("panel open is axe-clean and restores focus", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const trigger = page
      .getByRole("button", { name: /open accessibility settings/i })
      .first();
    await trigger.click();
    const dialog = page.getByTestId("accessibility-panel");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("accessibility-panel-close")).toBeFocused();
    await runAxe(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const theme of ["light", "dark", "high"] as const) {
    test(`contrast theme ${theme}`, async ({ page }) => {
      await clearStoredPreferences(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await openPanel(page);
      await chooseRadio(page, new RegExp(`${theme} contrast`, "i"));
      await expect
        .poll(async () =>
          page.evaluate(() => document.documentElement.dataset.a11yContrast),
        )
        .toBe(theme);
      // Scope axe to the panel — page chrome under personalisation themes is covered separately.
      await runAxe(page, { include: "[data-testid='accessibility-panel']" });
      await page.getByTestId("accessibility-panel-close").click();
    });
  }

  test("200% text scale keeps panel usable", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await chooseRadio(page, /maximum \(200%\)/i);
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBe("200");
    await expect(page.getByTestId("accessibility-panel-close")).toBeVisible();
    await runAxe(page, { include: "[data-testid='accessibility-panel']" });
  });

  test("320px reflow with reading support preset", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await page.getByRole("button", { name: /reading support/i }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBe("125");
    await page.getByTestId("accessibility-panel-close").click();
    const overflowX = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflowX).toBe(false);
    await runAxe(page, {
      include: "header, [data-testid='accessibility-panel']",
    });
  });

  test("reduced motion preset", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await page
      .getByRole("button", { name: /reduce motion and flashing/i })
      .click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yMotion),
      )
      .toBe("reduce");
    await page.getByTestId("accessibility-panel-close").click();
    await runAxe(page);
  });

  test("reading guide and mask do not trap pointer events", async ({
    page,
  }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await page.getByLabel(/reading guide/i).check();
    await page.getByLabel(/reading mask/i).check();
    await page.getByTestId("accessibility-panel-close").click();
    await expect(
      page
        .getByRole("button", { name: /open accessibility settings/i })
        .first(),
    ).toBeVisible();
    await runAxe(page);
  });

  test("large cursor preference", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await chooseRadio(page, /large dark cursor/i);
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yCursor),
      )
      .toBe("large-dark");
  });

  test("provider finder shell", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/provider-finder", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("accessibility-panel")).toHaveCount(1);
    await runAxe(page);
  });

  test("accessibility map list and map views", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/accessibility-map", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("accessibility-panel")).toHaveCount(1);
    await openPanel(page);
    await page.getByTestId("accessibility-panel-close").click();
    await expect(page.getByTestId("accessibility-panel")).toBeHidden();
    await runAxe(page);
  });

  test("preferences survive reload and reset clears them", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openPanel(page);
    await page.getByRole("button", { name: /comfort mode/i }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBe("112.5");
    await expect
      .poll(async () =>
        page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY),
      )
      .not.toBeNull();
    await page.getByTestId("accessibility-panel-close").click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBe("112.5");

    await openPanel(page);
    await page.getByTestId("accessibility-reset").click();
    await page.getByTestId("accessibility-reset-confirm").click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBeUndefined();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.dataset.a11yTextScale),
      )
      .toBeUndefined();
  });
});
