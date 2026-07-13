import { randomUUID } from "crypto";

import { Prisma } from "@prisma/client";

import { auditCareOSEvent } from "../audit/audit-service";
import type { CareOSContext } from "../context/careos-context";
import { hasConsentScope } from "../consent/consent-service";
import type { CareOSMissionResult } from "../orchestrator/orchestration-result";
import { createCareOSToolRegistry } from "../tools";
import { prisma } from "@/lib/prisma";
import { careTransportMissionInputSchema, type CareTransportMissionInput } from "./mission-types";

const STANDARD_PATH = {
  label: "Continue with the standard Care and Transport forms",
  href: "/care/new",
} as const;

export async function composeCareTransportMission(
  input: CareTransportMissionInput,
  context: CareOSContext
): Promise<CareOSMissionResult> {
  const parsed = careTransportMissionInputSchema.parse(input);
  const missingInformation: string[] = [];
  if (!parsed.pickupLocation) missingInformation.push("Your pickup location");

  if (!parsed.useAccessibilityProfile) {
    return {
      understoodGoal: parsed.goal,
      recommendations: [],
      missingInformation,
      consentRequired: ["profile.accessibility"],
      humanReviewRequired: false,
      nextActions: [
        { label: "Review accessibility permission", action: "review" },
        { label: "Continue without CareOS", action: "use_standard_form" },
      ],
      nonAIPath: STANDARD_PATH,
      notice: "No booking has been made.",
    };
  }
  if (!hasConsentScope(context, "profile.accessibility")) {
    return {
      understoodGoal: parsed.goal,
      recommendations: [],
      missingInformation,
      consentRequired: ["profile.accessibility"],
      humanReviewRequired: false,
      nextActions: [{ label: "Continue with standard forms", action: "use_standard_form" }],
      nonAIPath: STANDARD_PATH,
      notice: "No booking has been made.",
    };
  }
  if (missingInformation.length > 0) {
    return {
      understoodGoal: parsed.goal,
      recommendations: [],
      missingInformation,
      consentRequired: [],
      humanReviewRequired: false,
      nextActions: [{ label: "Add pickup information", action: "edit" }],
      nonAIPath: STANDARD_PATH,
      notice: "No booking has been made.",
    };
  }

  const tools = createCareOSToolRegistry();
  const appointments = await tools.execute<{
    appointments: { id: string; title: string; startAt: string; endAt: string; timezone: string }[];
  }>("read_upcoming_appointments", { query: parsed.appointmentQuery }, context);
  const appointment =
    appointments.appointments.find((item) => item.id === parsed.appointmentId) ??
    appointments.appointments[0];
  if (!appointment) {
    return {
      understoodGoal: parsed.goal,
      recommendations: [],
      missingInformation: ["An appointment reference or date that MapAble can identify"],
      consentRequired: [],
      humanReviewRequired: false,
      nextActions: [{ label: "Choose the appointment", action: "edit" }],
      nonAIPath: STANDARD_PATH,
      notice: "No booking has been made.",
    };
  }

  const [workers, vehicles, access] = await Promise.all([
    tools.execute<{
      workers: { id: string; name: string; organisationId: string }[];
    }>("search_compatible_workers", { serviceType: parsed.supportRequirement }, context),
    tools.execute<{
      vehicles: { id: string; name: string; organisationId: string }[];
    }>("read_transport_options", {}, context),
    tools.execute<{
      evidence: {
        placeId: string;
        placeName: string;
        sourceType: string;
        sourceDate: string;
        confidence: string;
        summary: string;
      }[];
    }>("read_access_evidence", { destination: parsed.destination ?? appointment.title }, context),
  ]);

  if (workers.workers.length === 0 || vehicles.vehicles.length === 0) {
    return {
      understoodGoal: parsed.goal,
      recommendations: [],
      missingInformation: [
        ...(workers.workers.length === 0 ? ["A compatible care worker"] : []),
        ...(vehicles.vehicles.length === 0 ? ["An accessible transport option"] : []),
      ],
      consentRequired: [],
      humanReviewRequired: true,
      nextActions: [{ label: "Ask MapAble support for help", action: "review" }],
      nonAIPath: STANDARD_PATH,
      notice: "No booking has been made.",
    };
  }

  const recommendationCount = Math.min(3, workers.workers.length, vehicles.vehicles.length);
  const evidence = access.evidence.map((item) => ({
    sourceType: "authoritative_mapable_record" as const,
    sourceDate: item.sourceDate,
    summary: `${item.placeName}: ${item.summary}`,
    verified: item.confidence === "verified",
  }));
  const uncertainty =
    evidence.length === 0
      ? ["No destination accessibility evidence was found. Confirm access directly with the destination."]
      : [];
  const recommendations = Array.from({ length: recommendationCount }, (_, index) => {
    const worker = workers.workers[index];
    const vehicle = vehicles.vehicles[index];
    return {
      id: randomUUID(),
      title: `Coordinated option ${index + 1}`,
      summary: `Support with ${worker.name} and accessible transport in ${vehicle.name}. MapAble includes preparation, boarding, travel and handover buffers around the ${appointment.title} appointment.`,
      carePlan: { workerName: worker.name, organisationId: worker.organisationId },
      transportPlan: { vehicleName: vehicle.name, organisationId: vehicle.organisationId },
      evidence,
      confidence: (uncertainty.length === 0 ? "medium" : "low") as "medium" | "low",
      uncertainty,
      hardConstraintsSatisfied: true,
    };
  });

  const mission = await prisma.careOSMission.create({
    data: {
      participantId: context.participant.participantId,
      requestId: context.requestId,
      missionType: "CARE_TRANSPORT_APPOINTMENT",
      inputSummary: {
        appointmentId: appointment.id,
        pickupProvided: Boolean(parsed.pickupLocation),
        destination: parsed.destination ?? appointment.title,
      } as Prisma.InputJsonValue,
      recommendations: {
        create: recommendations.map((recommendation) => ({
          title: recommendation.title,
          summary: recommendation.summary,
          confidence: recommendation.confidence,
          uncertainty: recommendation.uncertainty,
          result: recommendation as unknown as Prisma.InputJsonValue,
          evidence: {
            create: recommendation.evidence.map((item) => ({
              sourceType: item.sourceType,
              sourceDate: item.sourceDate ? new Date(item.sourceDate) : undefined,
              summary: item.summary,
              verificationStatus: item.verified ? "verified" : "unverified",
            })),
          },
        })),
      },
    },
  });
  await auditCareOSEvent(context, {
    action: "mission_composed",
    agent: "careos_manager",
    risk: "read",
    decision: "recommendation_created",
    metadata: { missionId: mission.id, recommendationCount },
  });

  return {
    understoodGoal: parsed.goal,
    recommendations,
    missingInformation: [],
    consentRequired: [],
    humanReviewRequired: uncertainty.length > 0,
    nextActions: [
      { label: "Review a plan", action: "review" },
      { label: "Edit details", action: "edit" },
      { label: "Reject these plans", action: "reject" },
      { label: "Continue with standard forms", action: "use_standard_form" },
    ],
    nonAIPath: STANDARD_PATH,
    notice: "No booking has been made.",
  };
}
