import type {
  AccessibilityEvidenceKind,
  MobilityDeviceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

export type EvidenceFreshness = {
  source: string;
  verifiedAt: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  isStale: boolean;
};

export type CompatibilityResult = {
  compatible: boolean;
  evidenceBased: boolean;
  reasons: string[];
  evidenceSources: string[];
  freshness: EvidenceFreshness[];
};

const STALE_AFTER_DAYS = 365;

function isRecordExpired(expiresAt: Date | null, now: Date): boolean {
  return expiresAt !== null && expiresAt < now;
}

function isRecordStale(verifiedAt: Date | null, now: Date): boolean {
  if (!verifiedAt) return true;
  const ageMs = now.getTime() - verifiedAt.getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function buildFreshness(
  source: string,
  verifiedAt: Date | null,
  expiresAt: Date | null,
  now: Date
): EvidenceFreshness {
  return {
    source,
    verifiedAt,
    expiresAt,
    isExpired: isRecordExpired(expiresAt, now),
    isStale: isRecordStale(verifiedAt, now),
  };
}

function inferDeviceType(
  requirements: MobilityRequirements
): MobilityDeviceType | null {
  if (requirements.requiresHoist) return "power_wheelchair";
  if (requirements.requiresWheelchairAccessible) return "manual_wheelchair";
  return null;
}

export async function assessVehicleCompatibility(
  vehicleId: string,
  requirements: MobilityRequirements
): Promise<CompatibilityResult> {
  const now = new Date();
  const [evidence, compatibilities, restraints, inspections, features] =
    await Promise.all([
      prisma.vehicleAccessibilityEvidence.findMany({ where: { vehicleId } }),
      prisma.mobilityDeviceCompatibility.findMany({ where: { vehicleId } }),
      prisma.restraintCapability.findMany({ where: { vehicleId } }),
      prisma.vehicleInspection.findMany({
        where: { vehicleId },
        orderBy: { inspectedAt: "desc" },
        take: 1,
      }),
      prisma.transportVehicleFeature.findMany({ where: { vehicleId }, take: 1 }),
    ]);

  const reasons: string[] = [];
  const evidenceSources: string[] = [];
  const freshness: EvidenceFreshness[] = [];

  for (const item of evidence) {
    freshness.push(
      buildFreshness(item.source, item.verifiedAt, item.expiresAt, now)
    );
    evidenceSources.push(item.source);
    if (isRecordExpired(item.expiresAt, now)) {
      reasons.push(`${item.kind} evidence expired (${item.source})`);
    }
  }

  const latestInspection = inspections[0];
  if (!latestInspection) {
    reasons.push("No vehicle inspection on record");
  } else {
    freshness.push(
      buildFreshness(
        latestInspection.evidenceSource,
        latestInspection.inspectedAt,
        latestInspection.expiresAt,
        now
      )
    );
    evidenceSources.push(latestInspection.evidenceSource);
    if (latestInspection.outcome === "fail") {
      reasons.push("Latest inspection failed");
    }
    if (isRecordExpired(latestInspection.expiresAt, now)) {
      reasons.push("Vehicle inspection expired");
    }
  }

  const deviceType = inferDeviceType(requirements);
  if (deviceType) {
    const deviceRecord = compatibilities.find((c) => c.deviceType === deviceType);
    if (!deviceRecord) {
      reasons.push(
        `No evidence-based compatibility record for ${deviceType.replace(/_/g, " ")}`
      );
    } else {
      freshness.push(
        buildFreshness(
          deviceRecord.evidenceSource,
          deviceRecord.verifiedAt,
          deviceRecord.expiresAt,
          now
        )
      );
      evidenceSources.push(deviceRecord.evidenceSource);
      if (!deviceRecord.compatible) {
        reasons.push(`Vehicle not compatible with ${deviceType.replace(/_/g, " ")} per evidence`);
      }
      if (isRecordExpired(deviceRecord.expiresAt, now)) {
        reasons.push("Mobility device compatibility evidence expired");
      }
    }
  }

  if (requirements.requiresWheelchairAccessible || requirements.requiresRamp) {
    const rampEvidence = evidence.find((e) => e.kind === "ramp_measurement");
    const liftEvidence = evidence.find((e) => e.kind === "lift_capacity");
    if (!rampEvidence && !liftEvidence) {
      const feature = features[0];
      if (feature?.wheelchairAccessible && !feature.rampAvailable && !feature.liftAvailable) {
        reasons.push(
          "Generic wheelchair-accessible label without ramp/lift evidence — not sufficient"
        );
      } else if (!feature?.rampAvailable && !feature?.liftAvailable) {
        reasons.push("No ramp or lift evidence on record");
      }
    }
  }

  if (requirements.requiresLift) {
    const liftEvidence = evidence.some((e) => e.kind === "lift_capacity");
    if (!liftEvidence) {
      reasons.push("Lift capacity evidence required but not found");
    }
  }

  if (requirements.requiresHoist) {
    const hasRestraint = restraints.some((r) => r.quantity > 0);
    if (!hasRestraint) {
      reasons.push("Restraint capability evidence required for hoist transfers");
    }
  }

  const evidenceBased = evidenceSources.length > 0;
  const compatible = reasons.length === 0 && evidenceBased;

  return {
    compatible,
    evidenceBased,
    reasons,
    evidenceSources: [...new Set(evidenceSources)],
    freshness,
  };
}

export async function listVehicleEvidence(vehicleId: string) {
  const [evidence, compatibilities, restraints, inspections] = await Promise.all([
    prisma.vehicleAccessibilityEvidence.findMany({
      where: { vehicleId },
      orderBy: { kind: "asc" },
    }),
    prisma.mobilityDeviceCompatibility.findMany({
      where: { vehicleId },
      orderBy: { deviceType: "asc" },
    }),
    prisma.restraintCapability.findMany({
      where: { vehicleId },
      orderBy: { restraintType: "asc" },
    }),
    prisma.vehicleInspection.findMany({
      where: { vehicleId },
      orderBy: { inspectedAt: "desc" },
      take: 5,
    }),
  ]);

  return { evidence, compatibilities, restraints, inspections };
}

export type CreateEvidenceInput = {
  vehicleId: string;
  kind: AccessibilityEvidenceKind;
  source: string;
  measuredValue?: string;
  unit?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  evidenceUrl?: string;
  notes?: string;
};

export async function recordAccessibilityEvidence(input: CreateEvidenceInput) {
  return prisma.vehicleAccessibilityEvidence.create({
    data: {
      vehicleId: input.vehicleId,
      kind: input.kind,
      source: input.source,
      measuredValue: input.measuredValue,
      unit: input.unit,
      verifiedAt: input.verifiedAt ?? new Date(),
      expiresAt: input.expiresAt,
      evidenceUrl: input.evidenceUrl,
      notes: input.notes,
    },
  });
}
