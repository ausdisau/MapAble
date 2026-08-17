import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONTRACTS = [
  {
    code: "CONSENT_SHARE_ACCESSIBILITY_V1",
    name: "Consent before sharing accessibility",
    type: "consent_gate" as const,
    rulesJson: [{ field: "hasConsent", operator: "eq", value: true, message: "Consent required" }],
  },
  {
    code: "PROVIDER_VERIFIED_BEFORE_ASSIGNMENT_V1",
    name: "Provider verified before assignment",
    type: "provider_verification_gate" as const,
    rulesJson: [
      {
        field: "verificationStatus",
        operator: "eq",
        value: "verified",
        message: "Provider must be verified",
      },
    ],
  },
  {
    code: "VEHICLE_SUITABLE_FOR_WHEELCHAIR_V1",
    name: "Vehicle wheelchair suitability",
    type: "transport_assignment_gate" as const,
    rulesJson: [
      {
        field: "wheelchairAccessible",
        operator: "eq",
        value: true,
        message: "Vehicle must be wheelchair accessible when required",
      },
    ],
  },
  {
    code: "INCIDENT_ESCALATE_CRITICAL_V1",
    name: "Critical incident escalation",
    type: "incident_escalation_gate" as const,
    rulesJson: [],
  },
];

export async function seedMapAblePhase4() {
  console.log("Seeding MapAble Core Phase 4...");

  const admin = await prisma.user.findUnique({
    where: { email: "admin@mapable.test" },
  });
  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const careOrg = await prisma.organisation.findFirst({
    where: { id: "seed-care-org" },
  });

  if (!admin || !participant) {
    console.log("  Skip Phase 4 — run earlier seeds first");
    return;
  }

  for (const c of CONTRACTS) {
    await prisma.smartContract.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        name: c.name,
        type: c.type,
        status: "active",
        rulesJson: c.rulesJson,
        createdById: admin.id,
        requiresHumanApproval: true,
      },
      update: { status: "active", rulesJson: c.rulesJson },
    });
  }

  await prisma.ndisSupportCategory.upsert({
    where: { code: "CORE" },
    create: { code: "CORE", name: "Core supports (demo)" },
    update: {},
  });

  await prisma.ndisSupportItem.upsert({
    where: { code: "01_001_0107_1_1" },
    create: {
      code: "01_001_0107_1_1",
      name: "Assistance with daily life — demo",
      categoryLabel: "Core",
      unitType: "hour",
      priceCapCents: 6500,
      active: true,
    },
    update: {},
  });

  const shift = await prisma.careShift.findFirst({
    where: { status: "awaiting_participant_approval" },
  });
  if (shift) {
    await prisma.timesheet.upsert({
      where: { careShiftId: shift.id },
      create: {
        careShiftId: shift.id,
        participantId: shift.participantId,
        organisationId: shift.organisationId,
        scheduledStart: shift.startAt,
        scheduledEnd: shift.endAt,
        status: "submitted",
        submittedAt: new Date(),
      },
      update: { status: "submitted" },
    });
  }

  await prisma.incidentReport.upsert({
    where: { id: "seed-incident-critical" },
    create: {
      id: "seed-incident-critical",
      category: "safeguarding_concern",
      severity: "critical",
      status: "triage",
      title: "Demo critical incident",
      description: "Fake safeguarding concern for admin triage testing.",
      participantId: participant.id,
      reportedById: participant.id,
      immediateRiskPresent: true,
      safeguardingConcern: true,
      possibleReportableIncident: true,
    },
    update: {},
  });

  if (careOrg) {
    await prisma.serviceAgreement.upsert({
      where: { id: "seed-agreement-1" },
      create: {
        id: "seed-agreement-1",
        participantId: participant.id,
        organisationId: careOrg.id,
        agreementType: "care",
        title: "Demo care service agreement",
        plainLanguageSummary:
          "This agreement explains how demo care services will be delivered. Fake data only.",
        startDate: new Date(),
        status: "active",
        createdById: admin.id,
        participantSignedAt: new Date(),
        providerSignedAt: new Date(),
        signedByParticipantId: participant.id,
      },
      update: {},
    });
  }

  const tb = await prisma.transportBooking.findFirst({
    where: { id: "seed-transport-2" },
  });
  if (tb) {
    await prisma.tripTrackingSession.upsert({
      where: { transportBookingId: tb.id },
      create: {
        transportBookingId: tb.id,
        status: "driver_en_route",
        startedAt: new Date(),
      },
      update: { status: "driver_en_route" },
    });
  }

  await prisma.analyticsSnapshot.create({
    data: {
      snapshotDate: new Date(),
      module: "summary",
      metricsJson: { careRequests: 3, transportBookings: 3 },
    },
  });

  console.log("  Phase 4 seed complete.");
}
