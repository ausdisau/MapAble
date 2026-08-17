import type { SecurityFrameworkType } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function ensureSecurityFrameworks() {
  if (!phase5Config.securityReadinessEnabled) return [];

  const types: SecurityFrameworkType[] = ["soc2", "iso27001"];
  const results = [];
  for (const type of types) {
    const existing = await prisma.securityFramework.findFirst({
      where: { type },
    });
    const fw =
      existing ??
      (await prisma.securityFramework.create({
        data: {
          type,
          name: type === "soc2" ? "SOC 2 readiness" : "ISO 27001 readiness",
        },
      }));
    results.push(fw);
  }
  return results;
}

export async function mapControlToEvidence(
  controlId: string,
  documentId?: string,
  notes?: string
) {
  return prisma.securityEvidence.create({
    data: { controlId, documentId, notes },
  });
}

export async function recordVendorRisk(params: {
  vendor: string;
  riskLevel: string;
  notes?: string;
}) {
  return prisma.vendorRiskAssessment.create({ data: params });
}
