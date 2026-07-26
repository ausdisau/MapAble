import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import type { DataClass } from "@/lib/ai/platform/types/classification";
import type {
  CapabilityMaturity,
  ProductionClaimStatus,
} from "@/lib/ai/platform/types/maturity";

export type CapabilityBackend = "deterministic" | "model_backed" | "hybrid";

export type AiCapabilityRegistration = {
  key: string;
  publicName: string;
  internalOwner: string;
  responsibleDomain: string;
  intendedUsers: string[];
  intendedPurpose: string;
  prohibitedUses: string[];
  maturity: CapabilityMaturity;
  productionClaimStatus: ProductionClaimStatus;
  featureFlag: string;
  backend: CapabilityBackend;
  modelIdentifier: string | null;
  promptVersion: string | null;
  toolAllowlist: string[];
  inputSchemaRef: string;
  outputSchemaRef: string;
  permittedDataClasses: DataClass[];
  prohibitedDataClasses: DataClass[];
  authorityCeiling: AuthorityCeiling;
  humanReviewRequired: boolean;
  participantApprovalRequired: boolean;
  fallbackBehaviour: string;
  maxLatencyMs: number;
  tokenBudget: number | null;
  costBudgetUsd: number | null;
  evaluationSuite: string | null;
  algorithmRegisterRef: string | null;
  reviewDueDate: string | null;
  killSwitchKey: string;
};
