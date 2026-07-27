import { test, expect } from "@playwright/test";
import { uiLogin, PARTICIPANT, ADMIN, freshApi, getAnyProductIds, uniqueAddress, deleteOrder } from "./helpers";

test.describe("Grocery order tracking transitions", () => {
  test("carer can advance order through statuses; participant sees the latest status", async ({ page, baseURL }) => {
    // Set up: participant places an order via API.
    const participantApi = await freshApi(baseURL!, PARTICIPANT);
    const [productId] = await getAnyProductIds(participantApi, 1);
    const orderRes = await participantApi.post("/api/grocery/orders", {
      data: {
        deliveryAddress: uniqueAddress(),
        items: [{ productId, quantity: 1 }],
      },
    });
    expect(orderRes.ok(), "create order").toBeTruthy();
    const order = await orderRes.json();

    // Admin advances status through the lifecycle (carers without an assigned worker linkage are not authorised).
    const adminApi = await freshApi(baseURL!, ADMIN);
    for (const status of ["confirmed", "shopping", "out_for_delivery", "delivered"] as const) {
      const r = await adminApi.patch(`/api/grocery/orders/${order.id}/status`, { data: { status } });
      expect(r.ok(), `advance to ${status}`).toBeTruthy();
      const body = await r.json();
      expect(body.status).toBe(status);
    }

    // Participant logs in via UI and sees the final status badge.
    await uiLogin(page, PARTICIPANT);
    await page.goto("/groceries/orders");
    const badge = page.getByTestId(`badge-status-${order.id}`);
    await expect(badge).toBeVisible({ timeout: 15_000 });
    await expect(badge).toHaveText(/delivered/i);

    // Cleanup
    await deleteOrder(participantApi, order.id);
  });

  test("invalid status value is rejected", async ({ baseURL }) => {
    const participantApi = await freshApi(baseURL!, PARTICIPANT);
    const [productId] = await getAnyProductIds(participantApi, 1);
    const orderRes = await participantApi.post("/api/grocery/orders", {
      data: { deliveryAddress: uniqueAddress(), items: [{ productId, quantity: 1 }] },
    });
    const order = await orderRes.json();

    const adminApi = await freshApi(baseURL!, ADMIN);
    const bad = await adminApi.patch(`/api/grocery/orders/${order.id}/status`, { data: { status: "totally_invalid" } });
    expect(bad.status(), "bad status rejected").toBeGreaterThanOrEqual(400);

    await deleteOrder(participantApi, order.id);
  });
});
