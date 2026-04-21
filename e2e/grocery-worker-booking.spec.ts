import { test, expect } from "@playwright/test";
// Note: this spec asserts the created shift's participantId matches the logged-in user
// to lock in the fix for the missing participantId regression in grocery-checkout.tsx.
import { uiLogin, PARTICIPANT, freshApi, pickWorkerId, uniqueAddress, deleteShift, deleteOrder } from "./helpers";

function futureDate(daysAhead = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("Worker-assisted grocery booking", () => {
  test("participant can book a worker for grocery shopping; a daily_living shift and order are created", async ({ page, baseURL }) => {
    const api = await freshApi(baseURL!, PARTICIPANT);
    const workerId = await pickWorkerId(api);
    const date = futureDate(14);

    await uiLogin(page, PARTICIPANT);
    await page.goto("/groceries/checkout");
    await expect(page.getByTestId("text-page-title")).toBeVisible();

    await page.getByTestId("radio-mode-worker").click();

    await page.getByTestId("input-delivery-address").fill(uniqueAddress());
    await page.getByTestId("input-access-needs").fill("Wheelchair access required");

    // Worker select (Radix). Use the trigger then click the option by test-id.
    await page.getByTestId("select-worker").click();
    await page.getByTestId(`option-worker-${workerId}`).click();

    await page.getByTestId("input-shift-date").fill(date);
    await page.getByTestId("input-shift-start").fill("10:00");
    await page.getByTestId("input-shift-end").fill("12:00");
    const shoppingList = `Milk, bread, eggs (${Math.random().toString(36).slice(2, 6)})`;
    await page.getByTestId("input-shopping-list").fill(shoppingList);

    const shiftResp = page.waitForResponse((r) =>
      r.url().endsWith("/api/shifts") && r.request().method() === "POST"
    );
    const orderResp = page.waitForResponse((r) =>
      r.url().endsWith("/api/grocery/orders") && r.request().method() === "POST"
    );

    await page.getByTestId("button-book-worker").click();

    const shiftRaw = await shiftResp;
    expect(shiftRaw.status(), "shift created").toBe(201);
    const shiftJson = await shiftRaw.json();
    const shift = Array.isArray(shiftJson) ? shiftJson[0] : shiftJson;
    expect(shift.ndisCategory).toBe("daily_living");
    expect(shift.workerId).toBe(workerId);

    // Lock in the participantId regression fix: the shift must belong to the logged-in participant.
    const me = await (await api.get("/api/auth/me")).json();
    expect(shift.participantId, "shift.participantId == logged-in user.id").toBe(me.id);

    const orderRaw = await orderResp;
    expect(orderRaw.ok(), "order created").toBeTruthy();
    const order = await orderRaw.json();
    expect(order.workerId).toBe(workerId);
    expect(order.shoppingList).toContain("Milk");

    await expect(page).toHaveURL(/\/groceries\/orders/, { timeout: 15_000 });
    await expect(page.getByTestId(`badge-worker-${order.id}`)).toBeVisible();

    // Cleanup
    await deleteOrder(api, order.id);
    await deleteShift(api, shift.id);
  });
});
