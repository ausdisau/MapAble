/**
 * AgentMail HTTP client for mapableau-new.
 *
 * Ported from REPL server/agentmail-service.ts. Removes the Replit connectors
 * proxy and calls the AgentMail REST API directly — the REPL's connector was
 * just a thin proxy to the same API.
 *
 * Required environment variables:
 *   AGENTMAIL_API_KEY    — AgentMail API key
 *   AGENTMAIL_BASE_URL   — (optional) override base URL (default https://api.agentmail.to/v0)
 *
 * Usage:
 *   import { createInbox, sendEmail, replyToMessage } from "@/lib/email/agentmail";
 */

const DEFAULT_BASE_URL = "https://api.agentmail.to/v0";

function getBaseUrl(): string {
  return (process.env.AGENTMAIL_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getApiKey(): string {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) throw new Error("AGENTMAIL_API_KEY is not set");
  return key;
}

export function agentMailEnabled(): boolean {
  return !!process.env.AGENTMAIL_API_KEY;
}

// ---------------------------------------------------------------------------
// Internal request helper
// ---------------------------------------------------------------------------

async function agentMailRequest<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
  };
  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${getBaseUrl()}${path}`, opts);
  let data: T;
  try {
    data = await res.json();
  } catch {
    data = { raw: await res.text() } as unknown as T;
  }
  return { status: res.status, data };
}

// ---------------------------------------------------------------------------
// Inbox management
// ---------------------------------------------------------------------------

export interface AgentMailInbox {
  id: string;
  username: string;
  display_name: string;
  email?: string;
}

export async function createInbox(
  username = "mapable-notifications",
  displayName = "MapAble Notifications",
): Promise<AgentMailInbox> {
  const { data } = await agentMailRequest<AgentMailInbox>("/inboxes", "POST", {
    username,
    display_name: displayName,
  });
  return data;
}

export async function listInboxes(): Promise<AgentMailInbox[]> {
  const { data } = await agentMailRequest<AgentMailInbox[] | { inboxes: AgentMailInbox[] }>(
    "/inboxes",
    "GET",
  );
  if (Array.isArray(data)) return data;
  if ("inboxes" in data) return (data as { inboxes: AgentMailInbox[] }).inboxes;
  return [];
}

// ---------------------------------------------------------------------------
// Message management
// ---------------------------------------------------------------------------

export interface AgentMailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  text?: string;
  html?: string;
  labels?: string[];
  createdAt?: string;
}

export async function sendEmail(
  inboxId: string,
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<AgentMailMessage> {
  const { data } = await agentMailRequest<AgentMailMessage>(
    `/inboxes/${inboxId}/messages/send`,
    "POST",
    { to, subject, text, html },
  );
  return data;
}

export async function replyToMessage(
  inboxId: string,
  messageId: string,
  text: string,
  html?: string,
): Promise<AgentMailMessage> {
  const { data } = await agentMailRequest<AgentMailMessage>(
    `/inboxes/${inboxId}/messages/${messageId}/reply`,
    "POST",
    { text, html },
  );
  return data;
}

export async function listMessages(
  inboxId: string,
  limit = 50,
): Promise<AgentMailMessage[]> {
  const { data } = await agentMailRequest<AgentMailMessage[] | { messages: AgentMailMessage[] }>(
    `/inboxes/${inboxId}/messages?limit=${limit}`,
    "GET",
  );
  if (Array.isArray(data)) return data;
  if ("messages" in data) return (data as { messages: AgentMailMessage[] }).messages;
  return [];
}

export async function getMessage(
  inboxId: string,
  messageId: string,
): Promise<AgentMailMessage> {
  const { data } = await agentMailRequest<AgentMailMessage>(
    `/inboxes/${inboxId}/messages/${messageId}`,
    "GET",
  );
  return data;
}

export async function updateMessageLabels(
  inboxId: string,
  messageId: string,
  addLabels?: string[],
  removeLabels?: string[],
): Promise<AgentMailMessage> {
  const { data } = await agentMailRequest<AgentMailMessage>(
    `/inboxes/${inboxId}/messages/${messageId}`,
    "PATCH",
    { add_labels: addLabels, remove_labels: removeLabels },
  );
  return data;
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function checkAgentMailHealth(): Promise<{
  status: "ok" | "auth_error" | "unavailable";
  message?: string;
}> {
  try {
    const { status } = await agentMailRequest("/inboxes", "GET");
    if (status === 401) return { status: "auth_error", message: "API key not configured or expired" };
    return { status: "ok" };
  } catch (e) {
    return { status: "unavailable", message: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Convenience wrapper matching the REPL's sendEmailViaAgentMail signature
// ---------------------------------------------------------------------------

let defaultInboxId: string | null = null;

/**
 * Convenience wrapper: finds or creates the default notifications inbox and
 * sends an email. Matches the REPL's sendEmailViaAgentMail(to, subject, body)
 * call signature used in auto-debit, notifications, etc.
 */
export async function sendEmailViaAgentMail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  if (!agentMailEnabled()) {
    console.warn("[agentmail] AGENTMAIL_API_KEY not set — email not sent");
    return;
  }
  if (!defaultInboxId) {
    const inboxes = await listInboxes();
    const existing = inboxes.find((i) =>
      i.username === "mapable-notifications" || i.display_name?.includes("MapAble"),
    );
    if (existing) {
      defaultInboxId = existing.id;
    } else {
      const created = await createInbox();
      defaultInboxId = created.id;
    }
  }
  await sendEmail(defaultInboxId, to, subject, body);
}
