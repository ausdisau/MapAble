import { CONSTITUTION_RULES } from "@/lib/platform/convergence-os/constitution/rules";
import { analyseSchemaCollisions } from "@/lib/platform/convergence-os/schema/collision-engine";
import { prisma } from "@/lib/prisma";

export type ConstitutionViolationFinding = {
  ruleKey: string;
  title: string;
  evidence: string;
  severity: string;
  affectedPaths: string[];
};

/**
 * Advisory constitution validation — reports only; never blocks merges.
 */
export async function validateConstitutionAdvisory(): Promise<{
  ruleCount: number;
  violations: ConstitutionViolationFinding[];
  persisted: number;
}> {
  const collisions = analyseSchemaCollisions();
  const findings: ConstitutionViolationFinding[] = [];

  const multiWriter = collisions.filter(
    (c) => c.category === "duplicate_canonical_writer"
  );
  if (multiWriter.length > 0) {
    findings.push({
      ruleKey: "C-001",
      title: "Authoritative writer conflict detected",
      evidence: multiWriter.map((c) => c.title).join("; "),
      severity: "high",
      affectedPaths: multiWriter.flatMap((c) => c.affectedModels ?? []),
    });
  }

  if (multiWriter.some((c) => (c.affectedModels ?? []).includes("PersonalVault"))) {
    findings.push({
      ruleKey: "C-008",
      title: "Personal Access Vault dual definition risk",
      evidence: "PersonalVault dual-defined across Vault and RightsOS tips.",
      severity: "high",
      affectedPaths: ["PersonalVault"],
    });
  }

  if (multiWriter.some((c) => (c.affectedModels ?? []).includes("CareOSMission"))) {
    findings.push({
      ruleKey: "C-009",
      title: "CareOSMission multi-writer conflict",
      evidence: "CareOSMission redefined on multiple programme tips.",
      severity: "high",
      affectedPaths: ["CareOSMission"],
    });
  }

  if (
    collisions.some((c) => c.category === "duplicate_canonical_writer")
  ) {
    findings.push({
      ruleKey: "C-015",
      title: "Parallel or duplicate core model definitions",
      evidence: "Collision engine reports duplicate canonical writers.",
      severity: "critical",
      affectedPaths: multiWriter.flatMap((c) => c.affectedModels ?? []).slice(0, 12),
    });
  }

  findings.push({
    ruleKey: "C-025",
    title: "Verify public claims against deployed evidence",
    evidence:
      "Advisory check: ensure no production marketing claim exceeds twin/capability evidence.",
    severity: "medium",
    affectedPaths: ["docs/", "capability catalogue"],
  });

  const rules = await prisma.architectureRule.findMany();
  const byKey = new Map(rules.map((r) => [r.ruleKey, r]));
  let persisted = 0;

  for (const finding of findings) {
    const rule = byKey.get(finding.ruleKey);
    if (!rule) continue;
    await prisma.architectureRuleViolation.create({
      data: {
        ruleId: rule.id,
        title: finding.title,
        evidence: finding.evidence,
        affectedPaths: finding.affectedPaths,
        severity: finding.severity,
        status: "open",
      },
    });
    persisted += 1;
  }

  return {
    ruleCount: CONSTITUTION_RULES.length,
    violations: findings,
    persisted,
  };
}
