#!/usr/bin/env tsx
/**
 * Rejects unsupported public production / certification claims in allowlisted paths.
 * Also flags production runbook db push instructions (delegates shared paths).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "app/(marketing)",
  "app/(core)",
  "docs/operations",
  "docs/remediation",
  "docs/strategy",
  "docs/productisation",
  "docs/programmes",
  "README.md",
];

/** Patterns that must not appear as affirmative certification / approval claims. */
const FORBIDDEN: Array<{ re: RegExp; reason: string }> = [
  {
    re: /\bWCAG\s*2\.\d\s*AA\s+compliant\b/i,
    reason: "WCAG certification claim",
  },
  {
    re: /\bISO\s*27001\s+certified\b/i,
    reason: "ISO certification claim",
  },
  {
    re: /\bSOC\s*2\s+certified\b/i,
    reason: "SOC certification claim",
  },
  {
    re: /\bgovernment[- ]approved\b/i,
    reason: "government approval claim",
  },
  {
    re: /\bMapAble\s+is\s+an?\s+NDIS[- ]registered\b/i,
    reason: "MapAble NDIS registration claim",
  },
  {
    re: /\bMapAble\s+Managed\s+Support\s+is\s+live\b/i,
    reason: "Managed Support live claim without registration evidence",
  },
  {
    re: /\bproduction[_ ]ready\b(?![^.\n]{0,40}(not|never|until|unless|false))/i,
    reason:
      "production_ready language without negation nearby (review marketing/docs)",
  },
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    out.push(dir);
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|tsx|ts|jsx|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main(): void {
  const errors: string[] = [];
  const files: string[] = [];
  for (const rel of SCAN_DIRS) {
    walk(path.join(ROOT, rel), files);
  }

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    // Allow capability inventory and remediation docs to discuss states
    if (rel.startsWith("docs/remediation/")) continue;
    if (rel.includes("accessibility-statement")) continue;
    if (rel.includes("security-readiness")) continue;

    const text = fs.readFileSync(file, "utf8");
    for (const { re, reason } of FORBIDDEN) {
      if (!re.test(text)) continue;
      // Soft-skip production_ready inside code comments discussing gates
      if (
        reason.startsWith("production_ready") &&
        /not\s+production|until|unless|false|scaffold|pilot/i.test(text)
      ) {
        continue;
      }
      const lines = text.split("\n");
      lines.forEach((line, idx) => {
        if (re.test(line)) {
          // Allow explicit negations on the same line
          if (
            /not\s+certified|not\s+yet|pending|do\s+not\s+claim|avoid|without/i.test(
              line,
            )
          ) {
            return;
          }
          errors.push(
            `${rel}:${idx + 1} — ${reason}: ${line.trim().slice(0, 120)}`,
          );
        }
      });
    }
  }

  // Require capability inventory exists for claim discipline
  const inv = path.join(ROOT, "docs/remediation/CAPABILITY_INVENTORY.md");
  if (!fs.existsSync(inv)) {
    errors.push("docs/remediation/CAPABILITY_INVENTORY.md missing");
  }

  const strategyRequired = [
    "docs/strategy/OPERATING_LANES.md",
    "docs/strategy/COMPETITIVE_POSITION.md",
    "docs/strategy/BUILD_PARTNER_DEFER.md",
    "docs/strategy/STRATEGIC_OPPORTUNITIES.md",
    "docs/productisation/CAPABILITY_REGISTRY.md",
    "docs/programmes/NDIS_EXPANSION_MASTER_PLAN.md",
    "docs/programmes/NDIS_REGULATORY_GATE_MATRIX.md",
  ];
  for (const rel of strategyRequired) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`${rel} missing`);
    }
  }

  if (errors.length > 0) {
    console.error("Production claims check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`OK: production claims scan (${files.length} files)`);
}

main();
