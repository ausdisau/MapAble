import type { GroceryOrder, User } from "@shared/schema";
import { storage } from "./storage";

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

export async function sendSmsViaTwilio(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return false;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      console.warn(`[notifications] Twilio send failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notifications] Twilio send threw:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendEmailViaAgentMail(to: string, subject: string, text: string): Promise<boolean> {
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

export interface SafeguardingAlert {
  sessionId: string;
  concernType: string;
  severity: string;
}

export interface SafeguardingAlertResult {
  attempted: boolean;
  recipients: number;
  emailed: number;
  reason?: string;
}

/**
 * Map a guardrail concern category to a fixed, non-identifying description.
 * Alerts deliberately never include the participant's free-text message —
 * only this templated summary — so no names, addresses, DOB or other narrative
 * PII can leak to the (potentially broad) staff distribution list.
 */
const SAFEGUARDING_SUMMARIES: Record<string, string> = {
  immediate_danger: "Possible immediate danger to a person's safety was detected in the conversation.",
  self_harm_suicide: "Possible self-harm or suicide risk was detected in the conversation.",
  abuse_neglect_exploitation: "Possible abuse, neglect or exploitation was detected in the conversation.",
  privacy_breach: "A possible privacy or personal-information breach was detected in the conversation.",
  safeguarding: "A safeguarding concern requiring human review was detected in the conversation.",
};

export function buildSafeguardingSummary(concernType: string): string {
  return SAFEGUARDING_SUMMARIES[concernType] || SAFEGUARDING_SUMMARIES.safeguarding;
}

/**
 * Resolve the staff recipients for urgent safeguarding alerts. Prefers an
 * explicit distribution list in SAFEGUARDING_ALERT_EMAIL (comma-separated);
 * otherwise falls back to the email addresses of all admin and provider users.
 */
async function resolveSafeguardingRecipients(): Promise<string[]> {
  const configured = (process.env.SAFEGUARDING_ALERT_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (configured.length > 0) return Array.from(new Set(configured));

  try {
    const [admins, providers] = await Promise.all([
      storage.getUsersByRole("admin"),
      storage.getUsersByRole("provider"),
    ]);
    const emails = [...admins, ...providers].map((u) => u.email).filter(Boolean);
    return Array.from(new Set(emails));
  } catch (e) {
    console.warn("[notifications] safeguarding recipient lookup threw:", e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * Notify MapAble staff in real time when the guardrail layer raises an urgent
 * safeguarding concern (immediate danger, self-harm, abuse/neglect, privacy
 * breach). Sends only the session ID, concern type, severity and a PII-redacted
 * summary — never the raw chat content. Never throws: notification failures are
 * logged and must not block the chat response.
 */
export interface ChatHandoffAlert {
  handoffId: string;
  sessionId: string;
  channel?: string | null;
}

export interface ChatHandoffAlertResult {
  attempted: boolean;
  recipients: number;
  emailed: number;
  reason?: string;
}

function getAppBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "";
  if (domain) return `https://${domain}`;
  return "http://localhost:5000";
}

/**
 * Resolve the staff recipients for human-handoff alerts. Prefers an explicit
 * distribution list in HANDOFF_ALERT_EMAIL (comma-separated); otherwise falls
 * back to the email addresses of all admin users (the "Human handoffs" tab is
 * admin-only).
 */
async function resolveHandoffRecipients(): Promise<string[]> {
  const configured = (process.env.HANDOFF_ALERT_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (configured.length > 0) return Array.from(new Set(configured));

  try {
    const admins = await storage.getUsersByRole("admin");
    const emails = admins.map((u) => u.email).filter(Boolean);
    return Array.from(new Set(emails));
  } catch (e) {
    console.warn("[notifications] handoff recipient lookup threw:", e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * Notify staff the moment a chat is escalated to a human. Called only after
 * the handoff record has been successfully persisted (never on the fail-closed
 * path). Includes a deep link straight to the handoff in the admin page.
 * Deliberately omits the participant's free-text escalation reason so no
 * narrative PII reaches the email distribution list. Never throws.
 */
export async function notifyChatHandoff(alert: ChatHandoffAlert): Promise<ChatHandoffAlertResult> {
  try {
    const recipients = await resolveHandoffRecipients();
    if (recipients.length === 0) {
      console.warn(`[notifications] handoff alert (handoff ${alert.handoffId}) has no staff recipients`);
      return { attempted: false, recipients: 0, emailed: 0, reason: "no_recipients" };
    }

    const link = `${getAppBaseUrl()}/admin/chat-guardrails?tab=handoffs&handoff=${encodeURIComponent(alert.handoffId)}`;
    const subject = "[MapAble] A chat participant asked for a human — handoff waiting";
    const text = [
      "A MapAble Chat participant has been escalated to human support and is waiting for a team member.",
      "",
      `Handoff ID: ${alert.handoffId}`,
      `Chat session: ${alert.sessionId}`,
      `Channel: ${alert.channel || "chat"}`,
      `Status: requested`,
      "",
      `Open this handoff: ${link}`,
      "",
      "This alert intentionally omits the participant's message content. Review the full record in the Human handoffs tab.",
      "",
      "— MapAble Chat",
    ].join("\n");

    let emailed = 0;
    for (const to of recipients) {
      const ok = await sendEmailViaAgentMail(to, subject, text);
      if (ok) emailed += 1;
    }

    if (emailed === 0) {
      console.warn(`[notifications] handoff alert (handoff ${alert.handoffId}) reached 0/${recipients.length} staff (AgentMail unavailable)`);
      return { attempted: true, recipients: recipients.length, emailed: 0, reason: "agentmail_unavailable" };
    }
    return { attempted: true, recipients: recipients.length, emailed };
  } catch (e) {
    console.warn("[notifications] handoff alert threw:", e instanceof Error ? e.message : e);
    return { attempted: true, recipients: 0, emailed: 0, reason: "exception" };
  }
}

export async function notifySafeguardingAlert(alert: SafeguardingAlert): Promise<SafeguardingAlertResult> {
  try {
    const recipients = await resolveSafeguardingRecipients();
    if (recipients.length === 0) {
      console.warn(`[notifications] safeguarding alert (session ${alert.sessionId}, ${alert.concernType}) has no staff recipients`);
      return { attempted: false, recipients: 0, emailed: 0, reason: "no_recipients" };
    }

    const subject = `[MapAble URGENT] Safeguarding concern (${alert.severity}) — ${alert.concernType}`;
    const text = [
      "An urgent safeguarding concern was raised in MapAble Chat and needs human review.",
      "",
      `Severity: ${alert.severity}`,
      `Concern type: ${alert.concernType}`,
      `Chat session: ${alert.sessionId}`,
      `Summary: ${buildSafeguardingSummary(alert.concernType)}`,
      "",
      "Open the safeguarding queue in MapAble → Admin → Chat Guardrails to review, assign and action this item.",
      "",
      "This alert intentionally omits sensitive details. Review the full record in the queue.",
      "",
      "— MapAble Safeguarding",
    ].join("\n");

    let emailed = 0;
    for (const to of recipients) {
      const ok = await sendEmailViaAgentMail(to, subject, text);
      if (ok) emailed += 1;
    }

    if (emailed === 0) {
      console.warn(`[notifications] safeguarding alert (session ${alert.sessionId}) reached 0/${recipients.length} staff (AgentMail unavailable)`);
      return { attempted: true, recipients: recipients.length, emailed: 0, reason: "agentmail_unavailable" };
    }
    return { attempted: true, recipients: recipients.length, emailed };
  } catch (e) {
    console.warn("[notifications] safeguarding alert threw:", e instanceof Error ? e.message : e);
    return { attempted: true, recipients: 0, emailed: 0, reason: "exception" };
  }
}
