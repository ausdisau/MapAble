import { test, expect } from "@playwright/test";
import { uiLogin, PARTICIPANT, freshApi, getAnyProductIds, uniqueAddress, deleteOrder } from "./helpers";

test.describe("Grocery self-checkout (Stripe modal)", () => {
  test("placing an order opens the Stripe payment modal initialised with a clientSecret", async ({ page, baseURL }) => {
    const api = await freshApi(baseURL!, PARTICIPANT);
    const [productId] = await getAnyProductIds(api, 1);

    await uiLogin(page, PARTICIPANT);
    await page.goto("/groceries");

    const card = page.getByTestId(`card-product-${productId}`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByTestId(`button-add-${productId}`).click();
    await page.getByTestId("link-grocery-checkout").click();
    await expect(page).toHaveURL(/\/groceries\/checkout/);

    await page.getByTestId("input-delivery-address").fill(uniqueAddress());
    await page.getByTestId("input-delivery-time").fill("Tomorrow morning");

    // Capture the order id and the pay endpoint response so we can assert clientSecret + cleanup.
    // Safety guard: refuse to run against a live Stripe key. /api/grocery/orders/:id/pay
    // creates real Stripe PaymentIntents server-side, so we only allow test mode here.
    const cfg = await page.context().request.get("/api/stripe/config");
    const cfgBody = await cfg.json();
    const pk: string = cfgBody.publishableKey || "";
    test.skip(!pk.startsWith("pk_test"), `Stripe key is not test mode (prefix=${pk.slice(0, 7)}); skipping to avoid live PaymentIntent creation`);

    const orderResp = page.waitForResponse((r) =>
      r.url().endsWith("/api/grocery/orders") && r.request().method() === "POST" && r.status() < 300
    );
    const payResp = page.waitForResponse((r) => /\/api\/grocery\/orders\/[^/]+\/pay$/.test(r.url()) && r.status() < 300);

    await page.getByTestId("button-place-order").click();

    const order = await (await orderResp).json();
    const pay = await (await payResp).json();
    expect(order.id, "order has id").toBeTruthy();
    expect(pay.clientSecret, "pay returns clientSecret").toMatch(/^pi_/);

    await expect(page.getByTestId("modal-grocery-payment")).toBeVisible();
    await expect(page.getByTestId("button-confirm-grocery-payment")).toBeVisible({ timeout: 20_000 });

    // Close modal without paying — we don't want to charge a real Stripe key in CI.
    await page.getByTestId("button-close-grocery-payment").click();

    // Best-effort cleanup; placed-but-unpaid order is acceptable to leave but try to delete.
    await deleteOrder(api, order.id);
  });
});
