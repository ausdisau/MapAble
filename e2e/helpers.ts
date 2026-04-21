import { APIRequestContext, BrowserContext, expect, request, Page } from "@playwright/test";

export const PARTICIPANT = { username: "demo_participant", password: "hashed_password" };
export const CARER = { username: "alex_m", password: "hashed_password" };
export const ADMIN = { username: "test_admin", password: "hashed_password" };

export async function uiLogin(page: Page, who: { username: string; password: string }) {
  // Use the same browser context so session cookies are shared with subsequent page navigations.
  const res = await page.context().request.post("/api/auth/login", { data: who });
  expect(res.status(), `login ${who.username}`).toBe(200);
  // Land on home; React Query will pick up the session via /api/auth/me.
  await page.goto("/");
}

export async function apiLogin(
  ctx: BrowserContext | APIRequestContext,
  who: { username: string; password: string }
): Promise<APIRequestContext> {
  const api = "request" in ctx ? ctx.request : ctx;
  const res = await api.post("/api/auth/login", { data: who });
  expect(res.status(), `login ${who.username}`).toBe(200);
  return api;
}

export async function freshApi(baseURL: string, who?: { username: string; password: string }) {
  const ctx = await request.newContext({ baseURL });
  if (who) {
    const res = await ctx.post("/api/auth/login", { data: who });
    expect(res.status(), `login ${who.username}`).toBe(200);
  }
  return ctx;
}

export async function getAnyProductIds(api: APIRequestContext, count = 2): Promise<string[]> {
  const res = await api.get("/api/grocery/products?limit=20");
  expect(res.ok()).toBeTruthy();
  const list = (await res.json()) as Array<{ id: string }>;
  expect(list.length, "need seeded products").toBeGreaterThanOrEqual(count);
  return list.slice(0, count).map((p) => p.id);
}

export async function pickWorkerId(api: APIRequestContext): Promise<string> {
  const res = await api.get("/api/workers");
  expect(res.ok()).toBeTruthy();
  const workers = (await res.json()) as Array<{ id: string }>;
  expect(workers.length, "need seeded workers").toBeGreaterThan(0);
  return workers[0].id;
}

export async function deleteOrder(api: APIRequestContext, orderId: string) {
  // Best-effort cleanup (route may not exist; ignore failures).
  try { await api.delete(`/api/grocery/orders/${orderId}`); } catch {}
}

export async function deleteShift(api: APIRequestContext, shiftId: string) {
  try { await api.delete(`/api/shifts/${shiftId}`); } catch {}
}

export function uniqueAddress(): string {
  const tag = Math.random().toString(36).slice(2, 8);
  return `${tag} Test Lane, Sydney NSW 2000`;
}
