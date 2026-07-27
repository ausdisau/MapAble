import { z } from "zod";
import { filterParticipantControlledCandidates } from "@mapable/domain-provider";

import { prisma } from "@/lib/prisma";

import { buildParticipantRightsSnapshot } from "../context/participant-rights";
import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({ serviceType: z.string().trim().min(1).optional() });
const outputSchema = z.object({
  workers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organisationId: z.string(),
      languages: z.array(z.string()),
      qualifications: z.string().nullable(),
      hardConstraintsSatisfied: z.literal(true),
    })
  ),
});

export const searchCompatibleWorkersTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "search_compatible_workers",
  description: "Finds verified workers after applying participant hard constraints.",
  module: "care",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["care:read:self"],
  requiredConsentScopes: ["care.preferences"],
  authorityLevel: "L2_RECOMMEND",
  requiresParticipantConfirmation: false,
  async execute(input, context) {
    const rights = await buildParticipantRightsSnapshot(context.participant.participantId);
    const workers = await prisma.workerProfile.findMany({
      where: {
        active: true,
        verificationStatus: "verified",
        organisation: { status: "active", verificationStatus: "verified" },
        ...(input.serviceType ? { serviceTypes: { has: input.serviceType } } : {}),
      },
      include: { organisation: true },
      take: 50,
    });
    const requiredCommunication = new Set(rights.requiredCommunicationCapabilities);
    const requiredCredentials = new Set(rights.requiredWorkerCredentials);
    const hardFilteredIds = new Set(
      filterParticipantControlledCandidates({
        candidates: workers.map((worker) => ({
          id: worker.id,
          providerId: worker.organisationId,
          verified: worker.verificationStatus === "verified",
          capabilities: worker.serviceTypes,
          communicationSupport: Array.isArray(worker.communicationCapabilities)
            ? worker.communicationCapabilities.filter(
                (value): value is string => typeof value === "string"
              )
            : [],
        })),
        blockedWorkerIds: rights.blockedWorkerIds,
        blockedProviderIds: rights.blockedProviderIds,
        requiredCapabilities: input.serviceType ? [input.serviceType] : [],
        requiredCommunicationSupport: rights.requiredCommunicationCapabilities,
      }).map((candidate) => candidate.id)
    );
    return {
      workers: workers
        .filter((worker) => hardFilteredIds.has(worker.id))
        .filter((worker) =>
          rights.requiredLanguagePreference
            ? worker.languages.includes(rights.requiredLanguagePreference)
            : true
        )
        .filter((worker) => {
          const capabilities = new Set(
            Array.isArray(worker.communicationCapabilities)
              ? worker.communicationCapabilities.filter((value): value is string => typeof value === "string")
              : []
          );
          return [...requiredCommunication].every((required) => capabilities.has(required));
        })
        .filter((worker) => {
          const qualifications = worker.qualificationsSummary ?? "";
          return [...requiredCredentials].every((required) =>
            qualifications.toLowerCase().includes(required.toLowerCase())
          );
        })
        .map((worker) => ({
          id: worker.id,
          name: worker.displayName,
          organisationId: worker.organisationId,
          languages: worker.languages,
          qualifications: worker.qualificationsSummary,
          hardConstraintsSatisfied: true as const,
        })),
    };
  },
};
