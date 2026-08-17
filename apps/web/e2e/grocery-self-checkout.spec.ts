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

    // Detect Stripe mode. We will only fill the test card if the key is a test publishable key.
    const cfg = await page.context().request.get("/api/stripe/config");
    const pk: string = (await cfg.json()).publishableKey || "";
    const stripeTestMode = pk.startsWith("pk_test");

    const orderResp = page.waitForResponse((r) =>
      r.url().endsWith("/api/grocery/orders") && r.request().method() === "POST" && r.status() < 300
    );
    const payResp = page.waitForResponse((r) => /\/api\/grocery\/orders\/[^/]+\/pay$/.test(r.url()) && r.status() < 300);

    await page.getByTestId("button-place-order").click();

    const order = await (await orderResp).json();
    const pay = await (await payResp).json();
    expect(order.id, "order has id").toBeTruthy();
    expect(pay.clientSecret, "pay returns a Stripe clientSecret").toMatch(/^pi_/);

    await expect(page.getByTestId("modal-grocery-payment")).toBeVisible();
    await expect(page.getByTestId("button-confirm-grocery-payment")).toBeVisible({ timeout: 20_000 });

    if (stripeTestMode) {
      // Fill Stripe test card 4242 4242 4242 4242 inside the Payment Element iframe(s),
      // then confirm. Server logs payment_status via the /confirm route.
      const paymentFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
      await paymentFrame.locator('input[name="number"]').fill("4242424242424242");
      await paymentFrame.locator('input[name="expiry"]').fill("12 / 34");
      await paymentFrame.locator('input[name="cvc"]').fill("123");
      // Postal code is required for some country defaults.
      const postal = paymentFrame.locator('input[name="postalCode"]');
      if (await postal.count()) await postal.fill("2000");

      const confirmResp = page.waitForResponse((r) =>
        /\/api\/grocery\/orders\/[^/]+\/confirm$/.test(r.url()) && r.request().method() === "POST"
      );
      await page.getByTestId("button-confirm-grocery-payment").click();
      const confirmRaw = await confirmResp;
      expect(confirmRaw.ok(), `confirm-payment ok (status=${confirmRaw.status()})`).toBeTruthy();

      // Order should now reflect a paid/processing payment status server-side.
      const refreshed = await api.get(`/api/grocery/orders/${order.id}`);
      const body = await refreshed.json();
      expect(["succeeded", "processing", "paid"], `payment status (got=${body.paymentStatus})`).toContain(body.paymentStatus);
    } else {
      // Non-test Stripe key (or no key): close the modal without confirming so we never
      // capture a real-mode payment from automated tests.
      await page.getByTestId("button-close-grocery-payment").click();
    }

    await deleteOrder(api, order.id);
  });
});
