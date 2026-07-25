import { createHash } from "crypto";

import {
  isPlatformShieldEnabled,
  NDIS_CODE_OF_CONDUCT_CREDENTIAL_TYPE,
} from "@/lib/compliance/platform-shield-config";
import { prisma } from "@/lib/prisma";

export type ShieldTier = "FULLY_COVERED" | "CONDITIONAL" | "NON_COMPLIANT";

export type CredentialExpiry = {
  key: string;
  label: string;
  expiresAt: string | null;
  daysRemaining: number | null;
};

export type ProviderComplianceShieldResult = {
  isShielded: boolean;
  activeShieldTier: ShieldTier;
  blockingDeficits: string[];
  conditionalDeficits: string[];
  credentialExpiries: CredentialExpiry[];
  dispatchEligible: boolean;
  deficitsHash: string;
  notice: string;
};

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Evaluate Registration Shield readiness for a worker under a registered partner.
 * Does not claim MapAble is an NDIS-registered platform provider.
 */
export async function evaluateProviderComplianceShield(
  workerId: string
): Promise<ProviderComplianceShieldResult> {
  if (!isPlatformShieldEnabled()) {
    throw new Error("PLATFORM_SHIELD_DISABLED");
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    include: {
      trustCredentials: {
        where: { credentialType: NDIS_CODE_OF_CONDUCT_CREDENTIAL_TYPE },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!worker) {
    throw new Error("WORKER_NOT_FOUND");
  }

  const blockingDeficits: string[] = [];
  const conditionalDeficits: string[] = [];

  if (worker.workerScreeningStatus !== "verified") {
    blockingDeficits.push("NDISWC (worker screening) not verified");
  }
  if (worker.wwccStatus !== "verified") {
    blockingDeficits.push("WWCC not verified");
  }
  if (worker.firstAidStatus !== "verified") {
    blockingDeficits.push("First Aid / CPR not verified");
  }
  if (worker.insuranceStatus !== "verified") {
    blockingDeficits.push("Insurance (PL & PI) not verified");
  }

  const codeCred = worker.trustCredentials[0];
  if (!codeCred || codeCred.status !== "verified") {
    blockingDeficits.push("NDIS Code of Conduct attestation missing");
  } else if (codeCred.expiresAt && codeCred.expiresAt.getTime() < Date.now()) {
    blockingDeficits.push("NDIS Code of Conduct attestation expired");
  }

  if (!worker.active) {
    blockingDeficits.push("Worker profile inactive");
  }
  if (worker.verificationStatus !== "verified") {
    conditionalDeficits.push("Overall verification status not verified");
  }

  // Soft: credentials approaching expiry (scaffold: updatedAt + 365d)
  const credentialExpiries: CredentialExpiry[] = [
    {
      key: "ndiswc",
      label: "NDISWC",
      expiresAt: new Date(
        worker.updatedAt.getTime() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      daysRemaining: daysUntil(
        new Date(worker.updatedAt.getTime() + 365 * 24 * 60 * 60 * 1000)
      ),
    },
    {
      key: "wwcc",
      label: "WWCC",
      expiresAt: new Date(
        worker.updatedAt.getTime() + 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      daysRemaining: daysUntil(
        new Date(worker.updatedAt.getTime() + 365 * 24 * 60 * 60 * 1000)
      ),
    },
  ];
  if (codeCred?.expiresAt) {
    credentialExpiries.push({
      key: "code_of_conduct",
      label: "Code of Conduct",
      expiresAt: codeCred.expiresAt.toISOString(),
      daysRemaining: daysUntil(codeCred.expiresAt),
    });
  }

  for (const exp of credentialExpiries) {
    if (exp.daysRemaining != null && exp.daysRemaining <= 30 && exp.daysRemaining > 0) {
      conditionalDeficits.push(`${exp.label} expires in ${exp.daysRemaining} days`);
    }
  }

  let activeShieldTier: ShieldTier;
  if (blockingDeficits.length > 0) {
    activeShieldTier = "NON_COMPLIANT";
  } else if (conditionalDeficits.length > 0) {
    activeShieldTier = "CONDITIONAL";
  } else {
    activeShieldTier = "FULLY_COVERED";
  }

  const isShielded = activeShieldTier !== "NON_COMPLIANT";
  const deficitsHash = createHash("sha256")
    .update([...blockingDeficits, ...conditionalDeficits].sort().join("|"))
    .digest("hex");

  return {
    isShielded,
    activeShieldTier,
    blockingDeficits,
    conditionalDeficits,
    credentialExpiries,
    dispatchEligible: isShielded && worker.active,
    deficitsHash,
    notice:
      "Registration Shield evaluates worker compliance readiness under a registered partner organisation. MapAble does not claim NDIS platform-provider registration.",
  };
}
