import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  buildCareSupportIntelligence,
  careSupportIntelligenceRequestSchema,
} from "@/intelligence/care/support-intelligence-service";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.enabled || !config.careOSNetworkEnabled || !config.modules.care) {
    return NextResponse.json(
      {
        error:
          "Care and Support intelligence is disabled. Standard Care forms remain available.",
      },
      { status: 503 },
    );
  }
  if (!hasPermission(user.primaryRole, "care:read:self")) {
    return NextResponse.json(
      { error: "You cannot use Care and Support intelligence for this account." },
      { status: 403 },
    );
  }

  try {
    const input = careSupportIntelligenceRequestSchema.parse(await request.json());
    const result = await buildCareSupportIntelligence({ user, request: input });

    if (config.auditEnabled) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole,
        participantId: user.id,
        action: "careos.support_intelligence.generated",
        entityType: "CareSupportIntelligence",
        metadata: {
          supportContext: input.supportContext,
          supportTypeCount: input.supportTypes.length,
          communicationPreferenceCount: input.communicationPreferences.length,
          accessRequirementCount: input.accessRequirements.length,
          linkedTransportRequired: input.linkedTransportRequired,
          highIntensitySupportRequested: input.highIntensitySupportRequested,
          includeExistingRecords: input.includeExistingRecords,
          readiness: result.readiness,
          checkStatuses: result.checks.map((check) => ({
            id: check.id,
            status: check.status,
          })),
          providerRecordCount: result.evidenceSummary.matchingProviderRecords,
          workerRecordCount: result.evidenceSummary.matchingWorkerRecords,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Please check the Care and Support details.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }
    console.error("[care-support-intelligence]", error);
    return NextResponse.json(
      { error: "Care and Support intelligence could not be prepared." },
      { status: 500 },
    );
  }
}
