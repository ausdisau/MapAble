import { PrismaClient, type MapAbleUserRole, type BookingType } from "@prisma/client";

const prisma = new PrismaClient();

/** bcrypt hash for dev password `Password123!` */
const PASSWORD_HASH =
  "$2b$10$3M5Pn.9r2FhZq.zxdgVhJuX56pWpG7PUViH0931hNLOkDcOM3g/TO";

export async function seedMapAbleCore() {
  console.log("Seeding MapAble Core Phase 1...");

  const users: Record<string, string> = {};
  const defs: { name: string; email: string; primaryRole: MapAbleUserRole }[] = [
    { name: "Alex Participant", email: "participant@mapable.test", primaryRole: "participant" },
    { name: "Sam Coordinator", email: "coordinator@mapable.test", primaryRole: "support_coordinator" },
    { name: "Jordan Worker", email: "worker@mapable.test", primaryRole: "support_worker" },
    { name: "MapAble Admin", email: "admin@mapable.test", primaryRole: "mapable_admin" },
  ];

  for (const u of defs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: PASSWORD_HASH,
        primaryRole: u.primaryRole,
        phone: "0400 000 000",
      },
      update: { primaryRole: u.primaryRole, passwordHash: PASSWORD_HASH },
    });
    users[u.email] = user.id;
    await prisma.userRoleAssignment.upsert({
      where: { userId_role: { userId: user.id, role: u.primaryRole } },
      create: { userId: user.id, role: u.primaryRole, isPrimary: true },
      update: { isPrimary: true },
    });
  }

  const participantId = users["participant@mapable.test"];

  const careOrg = await prisma.organisation.upsert({
    where: { id: "seed-care-org" },
    create: {
      id: "seed-care-org",
      name: "Demo Care Services Pty Ltd",
      organisationType: "care_provider",
      contactEmail: "care@demo.mapable.test",
      verificationStatus: "verified",
      ndisRegistrationClaimed: true,
      serviceRegions: ["Melbourne Metro"],
    },
    update: {},
  });

  const transportOrg = await prisma.organisation.upsert({
    where: { id: "seed-transport-org" },
    create: {
      id: "seed-transport-org",
      name: "Demo Accessible Transport",
      organisationType: "transport_provider",
      contactEmail: "transport@demo.mapable.test",
      verificationStatus: "pending_review",
      serviceRegions: ["Melbourne Metro"],
    },
    update: {},
  });

  await prisma.participantProfile.upsert({
    where: { userId: participantId },
    create: {
      userId: participantId,
      displayName: "Alex Participant",
      preferredName: "Alex",
      homeSuburb: "Footscray",
      homeState: "VIC",
      participantNotes: "Demo profile — fake data only.",
    },
    update: {},
  });

  await prisma.accessibilityProfile.upsert({
    where: { userId: participantId },
    create: {
      userId: participantId,
      mobilityNeeds: ["power_wheelchair"],
      communicationPreferences: ["plain_language", "sms"],
      transportRequirements: {
        requiresWheelchairAccessibleVehicle: true,
        needsExtraBoardingTime: true,
      },
      digitalPreferences: { largeText: true, simpleLanguageMode: true },
    },
    update: {},
  });

  await prisma.consentRecord.upsert({
    where: { id: "seed-consent-1" },
    create: {
      id: "seed-consent-1",
      subjectUserId: participantId,
      grantedToOrganisationId: careOrg.id,
      scope: "care_accessibility_share",
      purpose: "Share accessibility for demo care bookings",
      status: "active",
      createdById: participantId,
    },
    update: {},
  });

  const start = new Date();
  start.setDate(start.getDate() + 7);

  for (const type of ["care", "transport", "care_transport"] as BookingType[]) {
    await prisma.booking.upsert({
      where: { id: `seed-booking-${type}` },
      create: {
        id: `seed-booking-${type}`,
        participantId,
        bookingType: type,
        status: "requested",
        requestedStart: start,
        requestedEnd: new Date(start.getTime() + 2 * 60 * 60 * 1000),
        pickupAddress: type !== "care" ? "123 Demo St, Footscray VIC" : undefined,
        dropoffAddress: type !== "care" ? "456 Support Ave, Melbourne VIC" : undefined,
        careLocation: type !== "transport" ? "Community hub, Footscray" : undefined,
        createdById: participantId,
        shareAccessibility: type === "care",
        assignedOrganisationId: type === "transport" ? transportOrg.id : careOrg.id,
        segments:
          type === "care_transport"
            ? {
                create: [
                  { segmentType: "care", startTime: start, sortOrder: 0 },
                  {
                    segmentType: "outbound_transport",
                    startTime: start,
                    pickupAddress: "123 Demo St",
                    dropoffAddress: "Community hub",
                    sortOrder: 1,
                    bufferBeforeMinutes: 15,
                  },
                ],
              }
            : undefined,
      },
      update: {},
    });
  }

  await prisma.notification.create({
    data: {
      userId: participantId,
      category: "booking",
      title: "Booking request received",
      body: "Your demo care booking request has been recorded.",
    },
  });

  console.log("MapAble Core seed done (participant@mapable.test, admin@mapable.test).");
}
