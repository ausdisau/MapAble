import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase3() {
  console.log("Seeding MapAble Core Phase 3...");

  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const admin = await prisma.user.findUnique({
    where: { email: "admin@mapable.test" },
  });
  const workerUser = await prisma.user.findUnique({
    where: { email: "worker@mapable.test" },
  });
  const careOrg = await prisma.organisation.findFirst({
    where: { id: "seed-care-org" },
  });
  const transportOrg = await prisma.organisation.findFirst({
    where: { id: "seed-transport-org" },
  });

  if (!participant || !admin || !careOrg || !transportOrg) {
    console.log("  Skip Phase 3 — run Phase 1 seed first");
    return;
  }

  const employerOrg = await prisma.organisation.upsert({
    where: { id: "seed-employer-org" },
    create: {
      id: "seed-employer-org",
      name: "Demo Inclusive Employer Pty Ltd",
      organisationType: "employer",
      contactEmail: "jobs@demo.mapable.test",
      verificationStatus: "verified",
    },
    update: {},
  });

  const employerUser = await prisma.user.upsert({
    where: { email: "employer@mapable.test" },
    create: {
      email: "employer@mapable.test",
      name: "Demo Employer Admin",
      passwordHash:
        "$2b$10$3M5Pn.9r2FhZq.zxdgVhJuX56pWpG7PUViH0931hNLOkDcOM3g/TO",
      primaryRole: "employer",
    },
    update: { primaryRole: "employer" },
  });

  await prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: employerUser.id,
        organisationId: employerOrg.id,
      },
    },
    create: {
      userId: employerUser.id,
      organisationId: employerOrg.id,
      role: "employer",
    },
    update: {},
  });

  const wp1 = await prisma.workerProfile.upsert({
    where: { id: "seed-worker-1" },
    create: {
      id: "seed-worker-1",
      userId: workerUser?.id ?? participant.id,
      organisationId: careOrg.id,
      displayName: "Jordan Support",
      profileSummary: "Demo worker — fake data only.",
      serviceTypes: ["personal_care", "community_access"],
      serviceRegions: ["Melbourne Metro"],
      languages: ["English"],
      workerScreeningStatus: "verified",
      verificationStatus: "verified",
      highIntensityCompetencyVerified: true,
      active: true,
    },
    update: { highIntensityCompetencyVerified: true },
  });

  await prisma.workerProfile.upsert({
    where: { id: "seed-worker-2" },
    create: {
      id: "seed-worker-2",
      userId: participant.id,
      organisationId: careOrg.id,
      displayName: "Sam Backup Worker",
      serviceTypes: ["domestic_assistance"],
      verificationStatus: "pending_review",
      active: true,
    },
    update: {},
  });

  const vehicle1 = await prisma.vehicle.upsert({
    where: { id: "seed-vehicle-1" },
    create: {
      id: "seed-vehicle-1",
      organisationId: transportOrg.id,
      displayName: "WAV Van 01",
      vehicleType: "accessible_van",
      wheelchairAccessible: true,
      rampAvailable: true,
      wheelchairSpaces: 1,
      verificationStatus: "verified",
      active: true,
    },
    update: {},
  });

  await prisma.vehicle.upsert({
    where: { id: "seed-vehicle-2" },
    create: {
      id: "seed-vehicle-2",
      organisationId: transportOrg.id,
      displayName: "Standard Sedan",
      vehicleType: "standard_car",
      wheelchairAccessible: false,
      verificationStatus: "pending_review",
      active: true,
    },
    update: {},
  });

  const driver1 = await prisma.driverProfile.upsert({
    where: { id: "seed-driver-1" },
    create: {
      id: "seed-driver-1",
      userId: participant.id,
      organisationId: transportOrg.id,
      displayName: "Chris Driver",
      licenceStatus: "verified",
      accessibilityTrainingStatus: "verified",
      verificationStatus: "verified",
      active: true,
    },
    update: {},
  });

  await prisma.driverProfile.upsert({
    where: { id: "seed-driver-2" },
    create: {
      id: "seed-driver-2",
      userId: admin.id,
      organisationId: transportOrg.id,
      displayName: "Pat Operator",
      verificationStatus: "pending_review",
      active: true,
    },
    update: {},
  });

  const careReq1 = await prisma.careRequest.upsert({
    where: { id: "seed-care-req-1" },
    create: {
      id: "seed-care-req-1",
      participantId: participant.id,
      createdById: participant.id,
      requestType: "community_access",
      title: "Community outing support",
      description: "Support for local community access — demo only.",
      preferredDate: new Date(Date.now() + 86400000 * 3),
      address: "123 Demo St, Footscray VIC",
      linkedTransportRequired: true,
      status: "submitted",
    },
    update: {},
  });

  await prisma.careRequest.upsert({
    where: { id: "seed-care-req-2" },
    create: {
      id: "seed-care-req-2",
      participantId: participant.id,
      createdById: participant.id,
      requestType: "personal_care",
      title: "Morning personal care",
      description: "Demo personal care request.",
      status: "awaiting_admin_review",
    },
    update: {},
  });

  const careReq3 = await prisma.careRequest.upsert({
    where: { id: "seed-care-req-3" },
    create: {
      id: "seed-care-req-3",
      participantId: participant.id,
      createdById: participant.id,
      requestType: "appointment_support",
      title: "Medical appointment",
      description: "Assigned to care provider.",
      assignedOrganisationId: careOrg.id,
      status: "awaiting_provider_response",
      tasks: [{ name: "Appointment escort", intensity: "standard" }],
    },
    update: {},
  });

  const careBookingMvp = await prisma.careBooking.upsert({
    where: { careRequestId: careReq3.id },
    create: {
      id: "seed-care-booking-mvp",
      careRequestId: careReq3.id,
      participantId: participant.id,
      organisationId: careOrg.id,
      status: "pending_provider",
      tasks: [{ name: "Appointment escort", intensity: "standard" }],
      location: "Demo Medical Centre",
      scheduledStartAt: new Date(Date.now() + 86400000 * 4),
      scheduledEndAt: new Date(Date.now() + 86400000 * 4 + 7200000),
    },
    update: {},
  });

  await prisma.careServiceAgreement.upsert({
    where: { careBookingId: careBookingMvp.id },
    create: {
      careBookingId: careBookingMvp.id,
      placeholderTitle: "Demo service agreement",
      placeholderSummary: "Placeholder agreement for MVP walkthrough.",
      status: "placeholder",
    },
    update: {},
  });

  const shift1 = await prisma.careShift.upsert({
    where: { id: "seed-care-shift-1" },
    create: {
      id: "seed-care-shift-1",
      careRequestId: careReq1.id,
      participantId: participant.id,
      organisationId: careOrg.id,
      workerProfileId: wp1.id,
      startAt: new Date(Date.now() + 86400000 * 5),
      endAt: new Date(Date.now() + 86400000 * 5 + 14400000),
      location: "123 Demo St",
      status: "awaiting_participant_approval",
      checkInTime: new Date(),
      checkOutTime: new Date(),
    },
    update: {},
  });

  await prisma.careShift.upsert({
    where: { id: "seed-care-shift-2" },
    create: {
      id: "seed-care-shift-2",
      careRequestId: careReq1.id,
      participantId: participant.id,
      organisationId: careOrg.id,
      startAt: new Date(Date.now() + 86400000 * 7),
      endAt: new Date(Date.now() + 86400000 * 7 + 7200000),
      status: "scheduled",
    },
    update: {},
  });

  const tbLinked = await prisma.transportBooking.upsert({
    where: { id: "seed-transport-1" },
    create: {
      id: "seed-transport-1",
      participantId: participant.id,
      careRequestId: careReq1.id,
      pickupAddress: "Home — 123 Demo St",
      dropoffAddress: "Community centre",
      pickupWindowStart: new Date(Date.now() + 86400000 * 3),
      status: "draft",
      vehicleRequirements: { requiresWheelchairAccessible: true },
    },
    update: {},
  });

  await prisma.transportBooking.upsert({
    where: { id: "seed-transport-2" },
    create: {
      id: "seed-transport-2",
      participantId: participant.id,
      pickupAddress: "Footscray Station",
      dropoffAddress: "Melbourne CBD",
      pickupWindowStart: new Date(Date.now() + 86400000 * 2),
      status: "awaiting_operator_response",
      operatorOrganisationId: transportOrg.id,
    },
    update: {},
  });

  await prisma.transportBooking.upsert({
    where: { id: "seed-transport-3" },
    create: {
      id: "seed-transport-3",
      participantId: participant.id,
      pickupAddress: "Clinic",
      dropoffAddress: "Home",
      pickupWindowStart: new Date(Date.now() + 86400000 * 4),
      status: "vehicle_assigned",
      operatorOrganisationId: transportOrg.id,
      driverProfileId: driver1.id,
      vehicleId: vehicle1.id,
      vehicleRequirements: { requiresWheelchairAccessible: true },
    },
    update: {},
  });

  const job1 = await prisma.job.upsert({
    where: { id: "seed-job-1" },
    create: {
      id: "seed-job-1",
      employerOrganisationId: employerOrg.id,
      createdById: employerUser.id,
      title: "Administration Assistant",
      description: "Inclusive office role — demo listing only.",
      employmentType: "part_time",
      location: "Melbourne",
      remoteAllowed: true,
      flexibleHours: true,
      accessibilityFeatures: { screenReaderFriendly: true, flexibleBreaks: true },
      adjustmentOpennessStatement:
        "We welcome adjustment requests and will work with you.",
      status: "published",
    },
    update: {},
  });

  await prisma.job.upsert({
    where: { id: "seed-job-2" },
    create: {
      id: "seed-job-2",
      employerOrganisationId: employerOrg.id,
      createdById: employerUser.id,
      title: "Warehouse Team Member",
      description: "Draft role awaiting admin publish.",
      employmentType: "casual",
      status: "draft",
    },
    update: {},
  });

  const app1 = await prisma.jobApplication.upsert({
    where: { id: "seed-app-1" },
    create: {
      id: "seed-app-1",
      jobId: job1.id,
      participantId: participant.id,
      applicantSummary: "Interested in inclusive admin work.",
      reasonableAdjustmentRequest: "Flexible start time and screen reader software",
      shareAdjustments: false,
      transportSupportNeeded: true,
      status: "submitted",
      submittedAt: new Date(),
    },
    update: {},
  });

  await prisma.jobApplication.upsert({
    where: { id: "seed-app-2" },
    create: {
      id: "seed-app-2",
      jobId: job1.id,
      participantId: participant.id,
      applicantSummary: "Second demo application with shared adjustments.",
      reasonableAdjustmentRequest: "Quiet workspace",
      shareAdjustments: true,
      status: "under_review",
      submittedAt: new Date(),
    },
    update: {},
  });

  await prisma.calendarEvent.createMany({
    data: [
      {
        eventType: "care_request",
        title: careReq1.title,
        startAt: careReq1.preferredDate ?? new Date(),
        endAt: careReq1.preferredDate ?? new Date(),
        participantId: participant.id,
        careRequestId: careReq1.id,
        createdById: participant.id,
      },
      {
        eventType: "care_shift",
        title: "Care shift scheduled",
        startAt: shift1.startAt,
        endAt: shift1.endAt,
        participantId: participant.id,
        organisationId: careOrg.id,
        careShiftId: shift1.id,
        createdById: admin.id,
        visibility: "organisation",
      },
      {
        eventType: "transport_booking",
        title: "Transport trip",
        startAt: tbLinked.pickupWindowStart,
        endAt: tbLinked.pickupWindowStart,
        participantId: participant.id,
        transportBookingId: tbLinked.id,
        createdById: participant.id,
      },
      {
        eventType: "job_interview",
        title: "Interview — Administration Assistant",
        startAt: new Date(Date.now() + 86400000 * 10),
        endAt: new Date(Date.now() + 86400000 * 10 + 3600000),
        participantId: participant.id,
        jobApplicationId: app1.id,
        jobId: job1.id,
        createdById: participant.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.orchestrationEvent.upsert({
    where: { idempotencyKey: `care-transport-${careReq1.id}` },
    create: {
      eventType: "care_transport_link_created",
      careRequestId: careReq1.id,
      transportBookingId: tbLinked.id,
      idempotencyKey: `care-transport-${careReq1.id}`,
      createdById: participant.id,
    },
    update: {},
  });

  const approvedShift = await prisma.careShift.upsert({
    where: { id: "seed-care-shift-approved" },
    create: {
      id: "seed-care-shift-approved",
      careRequestId: careReq1.id,
      participantId: participant.id,
      organisationId: careOrg.id,
      workerProfileId: wp1.id,
      startAt: new Date(Date.now() - 86400000 * 2),
      endAt: new Date(Date.now() - 86400000 * 2 + 7200000),
      status: "approved",
      participantApprovalStatus: "approved",
      approvedById: participant.id,
      approvedAt: new Date(),
    },
    update: {},
  });

  await prisma.invoice.upsert({
    where: { id: "seed-invoice-shift" },
    create: {
      id: "seed-invoice-shift",
      participantId: participant.id,
      organisationId: careOrg.id,
      status: "draft",
      createdById: admin.id,
      lines: {
        create: [
          {
            description: "Approved care shift — requires review",
            serviceDate: approvedShift.startAt,
            quantity: 1,
            unitAmountCents: 0,
            totalAmountCents: 0,
          },
        ],
      },
    },
    update: {},
  });

  await prisma.availabilityWindow.createMany({
    data: [
      {
        organisationId: careOrg.id,
        workerProfileId: wp1.id,
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "17:00",
        timezone: "Australia/Sydney",
        effectiveFrom: new Date(),
        active: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("  Phase 3 seed complete.");
}
