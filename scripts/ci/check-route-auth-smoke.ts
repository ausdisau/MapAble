#!/usr/bin/env tsx
/**
 * Smoke: sensitive API route trees should import a server auth helper.
 * Heuristic — not a substitute for permission tests.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SENSITIVE_PREFIXES = [
  "app/api/admin",
  "app/api/billing",
  "app/api/care",
  "app/api/transport",
  "app/api/invoices",
  "app/api/payments",
  "app/api/payouts",
  "app/api/consents",
  "app/api/consent",
  "app/api/incidents",
  "app/api/participant-profile",
  "app/api/data-vault",
];

const AUTH_IMPORT =
  /requireApi|requireAuth|getServerSession|auth\(|requireAdmin|getToken|requirePermission|requireApiPermission|requireApiAdmin|requireAnyBillingPermission|requireBilling|requireOrganisation|requireParticipant|adminRoutes|getBillingHandler|getParticipantsHandler|getWorkersHandler|getBookingsHandler|getSafeguardingHandler|getComplianceHandler|getCommandCentreHandler|CronSecret|ADMIN_CRON|verifyCron|assertCron|withAdmin|canTriggerAdminIngestion|verifyN8nWebhookSignature|verifyWebhook|cron-auth/;

/** Intentionally public or low-sensitivity lookup routes (documented). */
const ALLOWLIST = new Set(["app/api/care/platform-org/route.ts"]);

function walkRoutes(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRoutes(full, out);
    else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const errors: string[] = [];
  let scanned = 0;

  for (const prefix of SENSITIVE_PREFIXES) {
    const routes = walkRoutes(path.join(ROOT, prefix));
    for (const route of routes) {
      scanned++;
      const rel = path.relative(ROOT, route);
      if (ALLOWLIST.has(rel)) continue;
      const text = fs.readFileSync(route, "utf8");
      // Allow explicit public markers
      if (/PUBLIC_ROUTE|@public|allowAnonymous/.test(text)) continue;
      if (!AUTH_IMPORT.test(text)) {
        errors.push(`${rel} — no recognisable server auth helper import`);
      }
    }
  }

  // Cap noise: fail if more than a threshold of unauthenticated sensitive routes
  // Newly added sensitive routes without auth always fail.
  if (errors.length > 0) {
    console.error("Route auth smoke FAILED:");
    // Print first 40
    for (const e of errors.slice(0, 40)) console.error(`  - ${e}`);
    if (errors.length > 40) {
      console.error(`  … and ${errors.length - 40} more`);
    }
    process.exit(1);
  }

  console.log(`OK: route auth smoke (${scanned} sensitive routes)`);
}

main();
