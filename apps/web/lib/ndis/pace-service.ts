import {
  defaultPaceBudgetOverlay,
  getPaceBudgetOverlay,
} from "@/lib/ndis/pace-endorsement-store";
import { prisma } from "@/lib/prisma";

export type PaceEndorsementStatus =
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "NOT_ENDORSED"
  | "EXPIRED";

export type PaceEndorsementVerification = {
  authorized: boolean;
  status: PaceEndorsementStatus;
  profile: {
    ndisNumber: string | null;
    supportCategoryCode: string;
    endorsedProviderId: string | null;
    expirationDate: string;
    remainingCategoryBudget: number;
    totalCategoryBudget: number;
  };
  warnings: string[];
};

function mapRelationshipStatus(status: string | undefined): PaceEndorsementStatus {
  if (status === "active") return "ACTIVE";
  if (status === "pending_verification") return "PENDING_APPROVAL";
  return "NOT_ENDORSED";
}

export async function verifyPaceEndorsement(
  participantId: string,
  providerId: string,
  categoryCode: string
): Promise<PaceEndorsementVerification> {
  const relationship = await prisma.participantProviderRelationship.findUnique({
    where: {
      participantId_providerOrgId: {
        participantId,
        providerOrgId: providerId,
      },
    },
  });

  const overlay =
    getPaceBudgetOverlay(participantId, categoryCode) ??
    defaultPaceBudgetOverlay(participantId, categoryCode);

  let status = mapRelationshipStatus(relationship?.status);
  const expiration = new Date(overlay.expirationDate);
  if (Number.isFinite(expiration.getTime()) && expiration.getTime() < Date.now()) {
    status = "EXPIRED";
  }

  const warnings: string[] = [];
  const budgetRatio =
    overlay.totalCategoryBudget > 0
      ? overlay.remainingCategoryBudget / overlay.totalCategoryBudget
      : 0;
  if (budgetRatio < 0.1) {
    warnings.push(
      "Remaining category budget is below 10% — review plan funding before claiming."
    );
  }

  const authorized =
    relationship?.providerOrgId === providerId && status === "ACTIVE";

  if (!authorized) {
    if (status === "EXPIRED") {
      warnings.push("PACE endorsement has expired for this category.");
    } else if (status === "PENDING_APPROVAL") {
      warnings.push("PACE endorsement is pending approval.");
    } else {
      warnings.push(
        "Provider is not endorsed under this participant's PACE plan category."
      );
    }
  }

  return {
    authorized,
    status,
    profile: {
      ndisNumber: overlay.ndisNumber ?? null,
      supportCategoryCode: categoryCode,
      endorsedProviderId: relationship?.providerOrgId ?? null,
      expirationDate: overlay.expirationDate,
      remainingCategoryBudget: overlay.remainingCategoryBudget,
      totalCategoryBudget: overlay.totalCategoryBudget,
    },
    warnings,
  };
}
