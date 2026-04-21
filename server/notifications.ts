import type { GroceryOrder, User } from "@shared/schema";

const AGENTMAIL_BASE_URL = process.env.AGENTMAIL_SERVICE_URL || "http://127.0.0.1:3001";
const NOTIFY_INBOX_ENV = "AGENTMAIL_NOTIFY_INBOX_ID";

let cachedInboxId: string | null = process.env[NOTIFY_INBOX_ENV] || null;
let inboxResolveAttemptedAt = 0;

const STATUS_COPY: Record<string, { subject: string; line: string }> = {
  placed:           { subject: "Your MapAble grocery order is placed",          line: "We've received your order and are preparing to confirm it." },
  confirmed:        { subject: "Your MapAble grocery order is confirmed",       line: "Your assigned worker has confirmed your order. Shopping will start shortly." },
  shopping:         { subject: "Your MapAble grocery order is being shopped",   line: "Your support worker is at the store collecting your items now." },
  out_for_delivery: { subject: "Your MapAble grocery order is on the way",      line: "Your shopping is complete and is on its way to your delivery address." },
  delivered:        { subject: "Your MapAble grocery order has been delivered", line: "Your order has been delivered. Please check the items and let us know if anything is missing." },
  cancelled:        { subject: "Your MapAble grocery order was cancelled",      line: "Your order has been cancelled. If this was not expected, please reply to this email." },
};

async function resolveInboxId(): Promise<string | null> {
  if (cachedInboxId) return cachedInboxId;
  // Avoid hammering AgentMail if it's down — only re-attempt every 60s.
  if (Date.now() - inboxResolveAttemptedAt < 60_000) return null;
  inboxResolveAttemptedAt = Date.now();
  try {
    const res = await fetch(`${AGENTMAIL_BASE_URL}/api/email/inboxes`);
    if (!res.ok) {
      console.warn(`[notifications] inbox lookup failed: ${res.status}`);
      return null;
    }
    const data = await res.json().catch(() => null) as any;
    // AgentMail returns { count, inboxes: [{ inbox_id, email, ... }] }; accept array fallback too.
    const list: any[] = Array.isArray(data) ? data : (data?.inboxes ?? data?.data ?? []);
    const pickId = (i: any): string | null => i?.inbox_id || i?.id || i?.email || null;
    const firstId = list.map(pickId).find(Boolean) || null;
    if (firstId) {
      cachedInboxId = firstId;
      console.log(`[notifications] using AgentMail inbox ${cachedInboxId}`);
      return cachedInboxId;
    }
    // No inbox yet — try to create one.
    const create = await fetch(`${AGENTMAIL_BASE_URL}/api/email/inboxes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "mapable-notifications", display_name: "MapAble Notifications" }),
    });
    const created = await create.json().catch(() => null) as any;
    const newId = pickId(created);
    if (create.ok && newId) {
      cachedInboxId = newId;
      console.log(`[notifications] created AgentMail inbox ${cachedInboxId}`);
      return cachedInboxId;
    }
    console.warn(`[notifications] could not create inbox: ${create.status}`);
    return null;
  } catch (e) {
    console.warn("[notifications] inbox lookup threw:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function sendEmailViaAgentMail(to: string, subject: string, text: string): Promise<boolean> {
  const inboxId = await resolveInboxId();
  if (!inboxId) return false;
  try {
    const res = await fetch(`${AGENTMAIL_BASE_URL}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inbox_id: inboxId, to, subject, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[notifications] AgentMail send failed: ${res.status} ${body.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notifications] AgentMail send threw:", e instanceof Error ? e.message : e);
    return false;
  }
}

export interface NotifyResult {
  attempted: boolean;
  emailed: boolean;
  reason?: string;
}

/**
 * Send a grocery order status notification to the participant. Never throws —
 * notification failures must not break the underlying order-status update.
 * Twilio SMS is not configured in this environment; the channel hook is
 * left in place but currently no-ops, with an explicit reason returned.
 */
export async function notifyGroceryOrderStatus(
  participant: Pick<User, "id" | "email" | "fullName" | "phoneNumber" | "notifyOrderUpdates">,
  order: Pick<GroceryOrder, "id" | "status" | "deliveryAddress">,
): Promise<NotifyResult> {
  if (!participant.notifyOrderUpdates) {
    return { attempted: false, emailed: false, reason: "opted_out" };
  }
  const copy = STATUS_COPY[order.status];
  if (!copy) return { attempted: false, emailed: false, reason: "unknown_status" };

  const text = [
    `Hi ${participant.fullName || "there"},`,
    "",
    copy.line,
    "",
    `Order ID: ${order.id}`,
    `Delivery address: ${order.deliveryAddress}`,
    `Current status: ${order.status.replace(/_/g, " ")}`,
    "",
    "You can change notification preferences in MapAble → Settings → Notifications.",
    "",
    "— MapAble",
  ].join("\n");

  const result: NotifyResult = { attempted: true, emailed: false };

  if (participant.email) {
    result.emailed = await sendEmailViaAgentMail(participant.email, copy.subject, text);
    if (!result.emailed) result.reason = "agentmail_unavailable";
  } else {
    result.reason = "no_email";
  }

  // SMS hook — Twilio not configured. Leaving an explicit no-op so the
  // shape of the call site doesn't change when SMS is enabled.
  if (process.env.TWILIO_ACCOUNT_SID && participant.phoneNumber) {
    // Future: dispatch SMS via Twilio here.
  }

  return result;
}
