import { randomUUID } from "node:crypto";

import type { CurrentUser } from "@/lib/auth/current-user";

import { buildMapAbleIntelligenceContext } from "./context";
import { explainJourneyPlan, recordJourneyAgentRun } from "./orchestrator";
import { createApprovalToken } from "./policies/approval-token";
import type {
  JourneyPlan,
  JourneyPlanRequest,
  TransportOption,
} from "./types";

function buildOptions(context: Awaited<ReturnType<typeof buildMapAbleIntelligenceContext>>): TransportOption[] {
  const mobility = context.mobilityRequirements;
  const needsVehicle =
    mobility.requiresWheelchairAccessible ||
    mobility.requiresRamp ||
    mobility.requiresHoist ||
    mobility.requiresLift;
  const extra = mobility.needsExtraBoardingTime ? 20 : 10;

  const options: TransportOption[] = [];
  if (needsVehicle) {
    options.push({
      id: "wav",
      mode: "wheelchair_accessible_vehicle",
      label: "Wheelchair-accessible vehicle",
      pickupLeadMinutes: extra,
      accessibilityFeatures: [
        mobility.requiresHoist ? "Hoist requested" : "Ramp or lift access requested",
        mobility.driverAssistanceRequired ? "Driver assistance requested" : "Driver assistance optional",
      ],
      rationale:
        "This option most directly matches the mobility requirements stored in your participant-controlled profile.",
      limitations: ["Live fleet availability has not been checked."],
      liveAvailabilityChecked: false,
    });
  }

  options.push({
    id: "community-transport",
    mode: "community_transport",
    label: "Accessible community transport",
    pickupLeadMinutes: extra + 10,
    accessibilityFeatures: ["Pre-booked accessible service", "Longer boarding buffer"],
    rationale:
      "Community transport may offer more assistance and scheduling support than a standard point-to-point service.",
    limitations: ["Eligibility and operating hours vary by provider.", "Live availability has not been checked."],
    liveAvailabilityChecked: false,
  });

  if (!needsVehicle) {
    options.push({
      id: "accessible-public-transport",
      mode: "accessible_public_transport",
      label: "Accessible public transport",
      pickupLeadMinutes: extra + 15,
      accessibilityFeatures: ["Step-free route required", "Disruption checks required"],
      rationale:
        "This may be suitable when the route is step-free and assistance requirements can be met.",
      limitations: ["Lift outages and live service conditions have not been checked."],
      liveAvailabilityChecked: false,
    });
  }

  return options;
}

export async function planAccessibleJourney(params: {
  user: CurrentUser;
  request: JourneyPlanRequest;
}): Promise<JourneyPlan> {
  const requestId = randomUUID();
  const context = await buildMapAbleIntelligenceContext(params.user, params.request);
  const toolsCalled = ["read_upcoming_appointments"];
  if (params.request.useAccessibilityProfile) toolsCalled.push("read_mobility_preferences");

  const missing = !context.selectedAppointment || !params.request.origin || !params.request.destination;
  if (missing) {
    return {
      requestId,
      status: "needs_information",
      appointment: context.selectedAppointment,
      summary: "MapAble needs an appointment, pickup address and destination before it can prepare a journey.",
      reasoning: "These details are required to create a specific transport proposal.",
      uncertainty: [],
      options: [],
      selectedOptionId: null,
      evidence: [],
      approval: {
        required: true,
        action: "create_transport_trip",
        token: null,
        expiresAt: null,
        confirmationText: "No booking can be created until the missing details are supplied.",
      },
      nonAiPath: { label: "Use the standard transport request form", href: "/dashboard/transport/new" },
      toolsCalled,
    };
  }

  const options = buildOptions(context);
  const narrative = await explainJourneyPlan({ context, options, message: params.request.message });
  const selected = options.find((option) => option.id === narrative.selectedOptionId) ?? options[0];
  const appointmentStart = new Date(context.selectedAppointment.startAt);
  const scheduledStart = new Date(
    appointmentStart.getTime() - selected.pickupLeadMinutes * 60 * 1000
  ).toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const trip = {
    pickupAddress: params.request.origin,
    dropoffAddress: params.request.destination,
    scheduledStart,
    scheduledEnd: context.selectedAppointment.endAt,
    accessNotes: context.accessNotes,
    mobilityRequirements: context.mobilityRequirements,
    prefillFromProfile: false as const,
  };
  const token = createApprovalToken({
    version: 1,
    action: "create_transport_trip",
    requestId,
    userId: params.user.id,
    optionId: selected.id,
    expiresAt,
    trip,
  });

  void recordJourneyAgentRun({
    participantId: params.user.id,
    actorUserId: params.user.id,
    requestId,
    toolsCalled,
    optionCount: options.length,
  });

  return {
    requestId,
    status: "ready_for_confirmation",
    appointment: context.selectedAppointment,
    summary: narrative.summary,
    reasoning: narrative.reasoning,
    uncertainty: narrative.uncertainty,
    options,
    selectedOptionId: selected.id,
    evidence: [
      {
        source: "calendar",
        label: "Appointment time",
        confidence: 1,
        details: context.selectedAppointment.startAt,
      },
      ...(context.profileUsed
        ? [{
            source: "participant_profile" as const,
            label: "Participant-controlled mobility preferences",
            confidence: 1,
            details: "Used only because profile sharing was selected for this request.",
          }]
        : []),
      {
        source: "mapable_transport_rules",
        label: "Boarding buffer",
        confidence: 0.8,
        details: `${selected.pickupLeadMinutes} minutes allowed before the appointment.`,
      },
    ],
    approval: {
      required: true,
      action: "create_transport_trip",
      token,
      expiresAt,
      confirmationText: `Confirm ${selected.label}. This will create a transport request; it does not guarantee provider acceptance.`,
    },
    nonAiPath: { label: "Use the standard transport request form", href: "/dashboard/transport/new" },
    toolsCalled,
  };
}
