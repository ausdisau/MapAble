import type { VehicleInspectionOutcome } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordVehicleInspection(params: {
  vehicleId: string;
  inspectedAt: Date;
  outcome: VehicleInspectionOutcome;
  evidenceSource: string;
  inspectorName?: string;
  expiresAt?: Date;
  findings?: string;
}) {
  return prisma.vehicleInspection.create({
    data: {
      vehicleId: params.vehicleId,
      inspectedAt: params.inspectedAt,
      outcome: params.outcome,
      evidenceSource: params.evidenceSource,
      inspectorName: params.inspectorName,
      expiresAt: params.expiresAt,
      findings: params.findings,
    },
  });
}

export async function getLatestInspection(vehicleId: string) {
  return prisma.vehicleInspection.findFirst({
    where: { vehicleId },
    orderBy: { inspectedAt: "desc" },
  });
}

export async function isVehicleInspectionCurrent(vehicleId: string): Promise<boolean> {
  const latest = await getLatestInspection(vehicleId);
  if (!latest) return false;
  if (latest.outcome === "fail") return false;
  if (latest.expiresAt && latest.expiresAt < new Date()) return false;
  return true;
}
