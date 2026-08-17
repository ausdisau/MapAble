#!/usr/bin/env tsx
/**
 * scripts/qb-reauth-notify.ts
 *
 * One-time migration script — notify all QB-connected operators that they
 * must re-link their QuickBooks account after the platform move to Vercel.
 *
 * Run ONCE before or immediately after the Vercel deployment goes live:
 *
 *   pnpm tsx scripts/qb-reauth-notify.ts [--dry-run] [--limit=N]
 *
 * Prerequisites:
 *   1. DATABASE_URL points at the production Neon database.
 *   2. AGENTMAIL_API_KEY is set (or SENDGRID_API_KEY if using SendGrid).
 *   3. NEXT_PUBLIC_APP_URL is set to the new Vercel domain, e.g.
 *      https://app.mapable.com.au
 *   4. QB_REDIRECT_URI has already been updated in the Intuit Developer
 *      console to point at the new domain — see QB_REAUTH_GUIDE.md before
 *      running this script.
 *
 * Safety:
 *   - --dry-run prints the would-be emails without sending anything.
 *   - Re-running is safe: users who have already re-linked
 *     (qbTokenExpiresAt is in the future and qbAccessToken is fresh) are
 *     skipped unless --force is passed.
 *   - A run log is written to scripts/.qb-reauth-run.json so you can audit
 *     who was notified and when.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const LIMIT = (() => {
  const flag = args.find((a) => a.startsWith("--limit="));
  return flag ? parseInt(flag.split("=")[1], 10) : Infinity;
})();

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
if (!APP_URL) {
  console.error(
    "ERROR: NEXT_PUBLIC_APP_URL must be set (e.g. https://app.mapable.com.au)"
  );
  process.exit(1);
}

const REAUTH_URL = `${APP_URL}/api/billing/quickbooks/auth`;
const SETTINGS_URL = `${APP_URL}/settings?section=billing`;
const RUN_LOG_PATH = join(__dirname, ".qb-reauth-run.json");

// ---------------------------------------------------------------------------
// Run log helpers
// ---------------------------------------------------------------------------

interface RunLogEntry {
  userId: string;
  email: string;
  notifiedAt: string;
}

function loadRunLog(): Map<string, RunLogEntry> {
  if (!existsSync(RUN_LOG_PATH)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(RUN_LOG_PATH, "utf8")) as RunLogEntry[];
    return new Map(raw.map((e) => [e.userId, e]));
  } catch {
    return new Map();
  }
}

function saveRunLog(log: Map<string, RunLogEntry>) {
  writeFileSync(
    RUN_LOG_PATH,
    JSON.stringify([...log.values()], null, 2),
    "utf8"
  );
}

// ---------------------------------------------------------------------------
// Email send — AgentMail primary, falls back to console in dry-run mode
// ---------------------------------------------------------------------------

async function sendNotification(
  to: string,
  name: string,
  reauthUrl: string,
  settingsUrl: string
): Promise<void> {
  const subject =
    "Action required: Re-link your QuickBooks account to MapAble";

  const textBody = `Hi ${name || "there"},

MapAble has moved to a new platform. As part of this move, QuickBooks Online
integrations need to be re-linked so your invoices keep syncing automatically.

Re-link your account now (takes about 30 seconds):
  ${reauthUrl}

What happens if I don't re-link?
  Your QuickBooks invoices will stop syncing. No data is lost — as soon as you
  re-link, sync resumes automatically from where it left off.

You can also reach this from your billing settings page:
  ${settingsUrl}

If you have any questions, reply to this email or contact your MapAble support
contact.

— The MapAble Team
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#1B6EB5">Action required: Re-link your QuickBooks account</h2>
  <p>Hi ${name || "there"},</p>
  <p>
    MapAble has moved to a new platform. As part of this move, QuickBooks Online
    integrations need to be re-linked so your invoices keep syncing automatically.
  </p>
  <p style="margin:32px 0;text-align:center">
    <a href="${reauthUrl}"
       style="background:#1B6EB5;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
      Re-link QuickBooks — takes ~30 seconds
    </a>
  </p>
  <h3 style="color:#444">What happens if I don't re-link?</h3>
  <p>
    Your QuickBooks invoices will stop syncing. No data is lost — as soon as you
    re-link, sync resumes automatically from where it left off.
  </p>
  <p>
    You can also find this button on your
    <a href="${settingsUrl}">billing settings page</a>.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#6b7280;font-size:13px">— The MapAble Team</p>
</body>
</html>
`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would send to: ${to}`);
    console.log(`  Subject: ${subject}`);
    return;
  }

  // AgentMail
  const agentMailKey = process.env.AGENTMAIL_API_KEY;
  const agentMailInboxId = process.env.AGENTMAIL_NOTIFICATIONS_INBOX_ID;

  if (agentMailKey && agentMailInboxId) {
    const res = await fetch(
      `${process.env.AGENTMAIL_BASE_URL ?? "https://api.agentmail.to/v0"}/inboxes/${agentMailInboxId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agentMailKey}`,
        },
        body: JSON.stringify({ to, subject, text: textBody, html: htmlBody }),
      }
    );
    if (!res.ok) {
      throw new Error(
        `AgentMail send failed (${res.status}): ${await res.text()}`
      );
    }
    return;
  }

  // Fallback: SendGrid
  const sgKey = process.env.SENDGRID_API_KEY;
  const sgFrom = process.env.SENDGRID_FROM_EMAIL ?? "noreply@mapable.com.au";
  if (sgKey) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sgKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: sgFrom, name: "MapAble" },
        subject,
        content: [
          { type: "text/plain", value: textBody },
          { type: "text/html", value: htmlBody },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(
        `SendGrid send failed (${res.status}): ${await res.text()}`
      );
    }
    return;
  }

  throw new Error(
    "No email provider configured. Set AGENTMAIL_API_KEY+AGENTMAIL_NOTIFICATIONS_INBOX_ID or SENDGRID_API_KEY."
  );
}

// ---------------------------------------------------------------------------
// Token freshness check — skip users who have already re-linked successfully
// ---------------------------------------------------------------------------

function needsRelink(user: {
  qbTokenExpiresAt: Date | null;
  qbAccessToken: string | null;
}): boolean {
  if (!user.qbAccessToken) return false; // never connected
  if (!user.qbTokenExpiresAt) return true; // token exists but no expiry recorded
  // Add 100-day buffer: QB refresh tokens expire after ~100 days of inactivity.
  // Anyone whose token will expire within 100 days should re-link now.
  const threshold = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
  return user.qbTokenExpiresAt <= threshold;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("MapAble QB re-auth migration notifier");
  console.log(DRY_RUN ? "  MODE: DRY RUN (no emails will be sent)" : "  MODE: LIVE");
  console.log(`  APP URL: ${APP_URL}`);
  console.log("=".repeat(60));

  const prisma = new PrismaClient();
  const runLog = loadRunLog();

  let candidates = await prisma.user.findMany({
    where: { qbRealmId: { not: null } },
    select: {
      id: true,
      email: true,
      fullName: true,
      qbRealmId: true,
      qbAccessToken: true,
      qbTokenExpiresAt: true,
    },
    orderBy: { fullName: "asc" },
  });

  console.log(`\nFound ${candidates.length} QB-connected user(s) in database.`);

  // Filter by re-link need unless --force
  if (!FORCE) {
    const before = candidates.length;
    candidates = candidates.filter((u) => needsRelink(u));
    const skipped = before - candidates.length;
    if (skipped > 0) {
      console.log(
        `  Skipping ${skipped} user(s) whose tokens appear fresh (use --force to notify them too).`
      );
    }
  }

  // Filter already-notified unless --force
  if (!FORCE) {
    const before = candidates.length;
    candidates = candidates.filter((u) => !runLog.has(u.id));
    const skipped = before - candidates.length;
    if (skipped > 0) {
      console.log(
        `  Skipping ${skipped} user(s) already notified (use --force to re-notify).`
      );
    }
  }

  // Apply limit
  if (isFinite(LIMIT)) {
    candidates = candidates.slice(0, LIMIT);
    console.log(`  Applying --limit: processing ${candidates.length} user(s).`);
  }

  if (candidates.length === 0) {
    console.log("\nNothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\nSending notifications to ${candidates.length} user(s)...\n`);

  let sent = 0;
  let failed = 0;

  for (const user of candidates) {
    const email = user.email ?? "";
    const name = user.fullName ?? "";
    if (!email) {
      console.warn(`  [SKIP] User ${user.id} has no email address.`);
      continue;
    }

    process.stdout.write(`  ${email} ... `);
    try {
      await sendNotification(email, name, REAUTH_URL, SETTINGS_URL);
      runLog.set(user.id, {
        userId: user.id,
        email,
        notifiedAt: new Date().toISOString(),
      });
      sent++;
      console.log("OK");
    } catch (e) {
      failed++;
      console.error(`FAILED — ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!DRY_RUN) {
    saveRunLog(runLog);
    console.log(`\nRun log written to: ${RUN_LOG_PATH}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`  Sent:   ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${candidates.length}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
