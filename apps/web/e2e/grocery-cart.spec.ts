import { test, expect } from "@playwright/test";
import { uiLogin, PARTICIPANT, freshApi, getAnyProductIds } from "./helpers";

test.describe("Grocery cart browse + add", () => {
  test("logged-in participant can search, add items, and reach checkout with cart populated", async ({ page, baseURL }) => {
    const api = await freshApi(baseURL!, PARTICIPANT);
    const [productId] = await getAnyProductIds(api, 1);

    await uiLogin(page, PARTICIPANT);
    await page.goto("/groceries");

    await expect(page.getByTestId("text-page-title")).toBeVisible();
    const card = page.getByTestId(`card-product-${productId}`);
    await expect(card).toBeVisible({ timeout: 15_000 });

    await card.getByTestId(`button-add-${productId}`).click();
    // After adding, the increase/decrease pair should appear.
    await expect(card.getByTestId(`text-quantity-${productId}`)).toHaveText("1");
    await card.getByTestId(`button-increase-${productId}`).click();
    await expect(card.getByTestId(`text-quantity-${productId}`)).toHaveText("2");

    await page.getByTestId("link-grocery-checkout").click();
    await expect(page).toHaveURL(/\/groceries\/checkout/);
    await expect(page.getByTestId(`cart-item-${productId}`)).toBeVisible();
    await expect(page.getByTestId("text-cart-total")).toBeVisible();
  });
});
