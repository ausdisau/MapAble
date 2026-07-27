import { z } from "zod";

export const mainframeContextManifestSchema = z
  .object({
    requestId: z.string().min(1),
    dataClassification: z.literal("SYNTHETIC"),
    participantReference: z.string().startsWith("syn_"),
    actorAssurance: z.enum(["AAL1", "AAL2", "AAL3"]),
    consentSnapshotId: z.string().startsWith("syn_"),
    consentScopes: z.array(z.string()),
    rightsSnapshotId: z.string().startsWith("syn_"),
    coreFactsHash: z.string().startsWith("sha256:"),
    policyVersion: z.string(),
    promptVersion: z.string(),
    graphVersion: z.string(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export type MainframeContextManifest = z.infer<
  typeof mainframeContextManifestSchema
>;

export type SyntheticRightsSnapshot = Readonly<{
  blockedWorkerIds: string[];
  blockedProviderIds: string[];
  requiredCredentials: string[];
  requiredCommunicationCapabilities: string[];
  requiredVehicleFeatures: string[];
  mobilityAidType?: string;
}>;
