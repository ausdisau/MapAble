import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAblePhase2() {
  console.log("Seeding MapAble Core Phase 2...");

  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const admin = await prisma.user.findUnique({
    where: { email: "admin@mapable.test" },
  });
  const careOrg = await prisma.organisation.findFirst({
    where: { id: "seed-care-org" },
  });
  const transportOrg = await prisma.organisation.findFirst({
    where: { id: "seed-transport-org" },
  });

  if (!participant || !admin) {
    console.log("  Skip Phase 2 seed — run Phase 1 seed first");
    return;
  }

  const providerAdmin = await prisma.user.upsert({
    where: { email: "provider@mapable.test" },
    create: {
      email: "provider@mapable.test",
      name: "Demo Provider Admin",
      passwordHash:
        "$2b$10$3M5Pn.9r2FhZq.zxdgVhJuX56pWpG7PUViH0931hNLOkDcOM3g/TO",
      primaryRole: "provider_admin",
    },
    update: {},
  });

  if (careOrg) {
    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: {
          userId: providerAdmin.id,
          organisationId: careOrg.id,
        },
      },
      create: {
        userId: providerAdmin.id,
        organisationId: careOrg.id,
        role: "provider_admin",
      },
      update: {},
    });
  }

  const conv1 = await prisma.conversation.upsert({
    where: { id: "seed-conv-1" },
    create: {
      id: "seed-conv-1",
      type: "participant_provider",
      title: "Care booking discussion",
      participantId: participant.id,
      organisationId: careOrg?.id,
      createdById: participant.id,
      lastMessageAt: new Date(),
      participants: {
        create: [
          { userId: participant.id },
          { userId: providerAdmin.id },
        ],
      },
    },
    update: {},
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderUserId: participant.id,
        body: "Hello, I have a question about my care booking.",
      },
      {
        conversationId: conv1.id,
        senderUserId: providerAdmin.id,
        body: "Thanks for your message. We will confirm details shortly.",
      },
      {
        conversationId: conv1.id,
        senderUserId: participant.id,
        body: "Thank you.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.supportTicket.upsert({
    where: { id: "seed-ticket-1" },
    create: {
      id: "seed-ticket-1",
      title: "Help with transport booking",
      description: "I need help updating pickup time.",
      category: "booking_help",
      status: "open",
      priority: "normal",
      participantId: participant.id,
      createdById: participant.id,
    },
    update: {},
  });

  await prisma.supportTicket.upsert({
    where: { id: "seed-ticket-safeguarding" },
    create: {
      id: "seed-ticket-safeguarding",
      title: "Demo safeguarding concern",
      description: "Fake demo data for admin warning UI only.",
      category: "safeguarding_concern",
      status: "escalated",
      priority: "urgent",
      participantId: participant.id,
      createdById: participant.id,
      requiresIncidentReview: true,
    },
    update: {},
  });

  const funding1 = await prisma.participantFundingSource.upsert({
    where: { id: "seed-funding-1" },
    create: {
      id: "seed-funding-1",
      participantId: participant.id,
      type: "ndis_plan_managed",
      displayName: "NDIS plan managed (demo)",
      status: "active",
      createdById: participant.id,
    },
    update: {},
  });

  await prisma.participantFundingSource.upsert({
    where: { id: "seed-funding-2" },
    create: {
      id: "seed-funding-2",
      participantId: participant.id,
      type: "private_pay",
      displayName: "Private co-pay (demo)",
      status: "pending_review",
      createdById: participant.id,
    },
    update: {},
  });

  await prisma.booking.updateMany({
    where: { id: "seed-booking-care" },
    data: {
      assignedOrganisationId: careOrg?.id,
      providerResponseStatus: "sent",
      fundingSourceId: funding1.id,
    },
  });

  await prisma.booking.updateMany({
    where: { id: "seed-booking-transport" },
    data: {
      assignedOrganisationId: transportOrg?.id,
      providerResponseStatus: "accepted",
      status: "confirmed",
      providerRespondedAt: new Date(),
    },
  });

  const invoiceDraft = await prisma.invoice.upsert({
    where: { id: "seed-invoice-1" },
    create: {
      id: "seed-invoice-1",
      participantId: participant.id,
      organisationId: careOrg?.id,
      bookingId: "seed-booking-transport",
      fundingSourceId: funding1.id,
      status: "draft",
      createdById: admin.id,
      lines: {
        create: [
          {
            description: "Accessible transport — standard trip",
            serviceDate: new Date(),
            quantity: 1,
            unitAmountCents: 4500,
            totalAmountCents: 4500,
            claimableByNdis: true,
            supportItemCode: "DEMO-TRANSPORT",
          },
        ],
      },
    },
    update: {},
  });

  await prisma.billingPreflightResult.create({
    data: {
      invoiceId: invoiceDraft.id,
      status: "failed",
      checks: { invoice_lines_present: true },
      failedReasons: ["Funding source tag should be selected for review."],
      createdById: admin.id,
    },
  });

  const invoicePass = await prisma.invoice.upsert({
    where: { id: "seed-invoice-2" },
    create: {
      id: "seed-invoice-2",
      participantId: participant.id,
      organisationId: careOrg?.id,
      fundingSourceId: funding1.id,
      status: "approved_for_invoicing",
      subtotalCents: 10000,
      totalCents: 10000,
      createdById: admin.id,
      lines: {
        create: [
          {
            description: "Community participation support",
            serviceDate: new Date(),
            quantity: 2,
            unitAmountCents: 5000,
            totalAmountCents: 10000,
            claimableByNdis: false,
          },
        ],
      },
    },
    update: {},
  });

  await prisma.billingPreflightResult.create({
    data: {
      invoiceId: invoicePass.id,
      status: "passed",
      checks: { currency_is_aud: true, amounts_are_positive: true },
      failedReasons: [],
      createdById: admin.id,
    },
  });

  await prisma.bookingTimelineEvent.createMany({
    data: [
      {
        bookingId: "seed-booking-care",
        eventType: "booking_submitted",
        title: "Booking request submitted",
        actorUserId: participant.id,
      },
      {
        bookingId: "seed-booking-transport",
        eventType: "provider_accepted",
        title: "Provider accepted booking",
        actorUserId: providerAdmin.id,
      },
      {
        bookingId: "seed-booking-care_transport",
        eventType: "booking_confirmed",
        title: "Booking confirmed",
        actorUserId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Phase 2 seed complete.");
}
