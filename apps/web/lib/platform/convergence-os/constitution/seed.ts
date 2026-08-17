import { CONSTITUTION_RULES } from "@/lib/platform/convergence-os/constitution/rules";
import { prisma } from "@/lib/prisma";

export async function seedArchitectureConstitution(): Promise<{
  constitutionId: string;
  version: number;
  rulesUpserted: number;
  ruleKeys: string[];
}> {
  const constitution = await prisma.architectureConstitution.upsert({
    where: { constitutionKey: "mapable_architecture_constitution" },
    create: {
      constitutionKey: "mapable_architecture_constitution",
      title: "MapAble Architecture Constitution",
      status: "active",
    },
    update: {
      title: "MapAble Architecture Constitution",
      status: "active",
    },
  });

  const latest = await prisma.architectureConstitutionVersion.findFirst({
    where: { constitutionId: constitution.id },
    orderBy: { version: "desc" },
  });
  const version = (latest?.version ?? 0) + 1;

  await prisma.architectureConstitutionVersion.create({
    data: {
      constitutionId: constitution.id,
      version,
      summary: `Wave 9 seed — C-001…C-025 advisory (v${version})`,
      approvedBy: null,
    },
  });

  const ruleKeys: string[] = [];
  for (const rule of CONSTITUTION_RULES) {
    await prisma.architectureRule.upsert({
      where: { ruleKey: rule.ruleKey },
      create: {
        constitutionId: constitution.id,
        ruleKey: rule.ruleKey,
        title: rule.title,
        ruleClass: rule.ruleClass,
        plainLanguage: rule.plainLanguage,
        rationale: rule.rationale,
        severity: rule.severity,
        detectionMethod: rule.detectionMethod,
        owner: rule.owner,
        approver: rule.approver,
        affectedDomains: rule.affectedDomains,
        prohibitedPatterns: rule.prohibitedPatterns,
        requiredConditions: rule.requiredConditions,
      },
      update: {
        title: rule.title,
        ruleClass: rule.ruleClass,
        plainLanguage: rule.plainLanguage,
        rationale: rule.rationale,
        severity: rule.severity,
        detectionMethod: rule.detectionMethod,
        owner: rule.owner,
        approver: rule.approver,
        affectedDomains: rule.affectedDomains,
        prohibitedPatterns: rule.prohibitedPatterns,
        requiredConditions: rule.requiredConditions,
      },
    });
    ruleKeys.push(rule.ruleKey);
  }

  return {
    constitutionId: constitution.id,
    version,
    rulesUpserted: ruleKeys.length,
    ruleKeys,
  };
}
