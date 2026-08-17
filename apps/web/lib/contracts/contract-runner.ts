import { Prisma, type ContractRunResult } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase4Config } from "@/lib/config/phase4";
import { prisma } from "@/lib/prisma";

type Rule = {
  field: string;
  operator: "eq" | "neq" | "in" | "exists";
  value?: unknown;
  message: string;
};

function evaluateRule(rule: Rule, context: Record<string, unknown>): boolean {
  const val = context[rule.field];
  switch (rule.operator) {
    case "eq":
      return val === rule.value;
    case "neq":
      return val !== rule.value;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(val);
    case "exists":
      return val !== undefined && val !== null && val !== "";
    default:
      return false;
  }
}

export async function runSmartContract(params: {
  contractCode: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  participantId?: string;
  context: Record<string, unknown>;
}) {
  if (!phase4Config.smartContractRunnerEnabled) {
    return { result: "not_applicable" as ContractRunResult, skipped: true };
  }

  const contract = await prisma.smartContract.findFirst({
    where: { code: params.contractCode, status: "active" },
  });
  if (!contract) {
    return { result: "not_applicable" as ContractRunResult, reason: "No active contract" };
  }

  const rules = (contract.rulesJson as Rule[]) ?? [];
  const findings: { code: string; message: string; severity: string }[] = [];
  let passed = true;

  for (const rule of rules) {
    const ok = evaluateRule(rule, params.context);
    if (!ok) {
      passed = false;
      findings.push({
        code: rule.field,
        message: rule.message,
        severity: "error",
      });
    }
  }

  const result: ContractRunResult = passed
    ? "passed"
    : contract.requiresHumanApproval
      ? "review_required"
      : "blocked";

  const run = await prisma.smartContractRun.create({
    data: {
      smartContractId: contract.id,
      actorUserId: params.actorUserId,
      participantId: params.participantId,
      entityType: params.entityType,
      entityId: params.entityId,
      result,
      contextJson: params.context as Prisma.InputJsonValue,
      findingsJson: findings,
      findings: {
        create: findings.map((f) => ({
          code: f.code,
          message: f.message,
          severity: f.severity,
        })),
      },
    },
  });

  if (result === "passed") {
    const { createAttestation } = await import("@/lib/attestations/attestation-service");
    await createAttestation({
      type: "contract_passed",
      actorUserId: params.actorUserId,
      participantId: params.participantId,
      entityType: params.entityType,
      entityId: params.entityId,
      claim: `Contract ${contract.code} passed`,
      contractRunId: run.id,
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "contract.run",
    entityType: "SmartContractRun",
    entityId: run.id,
    metadata: { result, contractCode: contract.code },
  });

  return { run, result, findings };
}

export async function runProviderVerificationGate(
  organisationId: string,
  actorUserId: string
) {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  return runSmartContract({
    contractCode: "PROVIDER_VERIFIED_BEFORE_ASSIGNMENT_V1",
    actorUserId,
    entityType: "Organisation",
    entityId: organisationId,
    context: {
      verificationStatus: org?.verificationStatus,
      status: org?.status,
    },
  });
}

export async function runVehicleWheelchairGate(
  transportBookingId: string,
  vehicleId: string,
  actorUserId: string
) {
  const [tb, vehicle] = await Promise.all([
    prisma.transportBooking.findUnique({ where: { id: transportBookingId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);
  const reqs = (tb?.vehicleRequirements ?? {}) as Record<string, boolean>;
  return runSmartContract({
    contractCode: "VEHICLE_SUITABLE_FOR_WHEELCHAIR_V1",
    actorUserId,
    entityType: "TransportBooking",
    entityId: transportBookingId,
    participantId: tb?.participantId,
    context: {
      requiresWheelchair: reqs.requiresWheelchairAccessible,
      wheelchairAccessible: vehicle?.wheelchairAccessible,
    },
  });
}
