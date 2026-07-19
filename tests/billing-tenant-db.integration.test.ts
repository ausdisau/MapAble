/**
 * Optional DB-backed tenant isolation checks.
 * Runs only when BILLING_INTEGRATION_DB=true and DATABASE_URL is set.
 *
 *   BILLING_INTEGRATION_DB=true pnpm exec vitest run tests/billing-tenant-db.integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const enabled =
  process.env.BILLING_INTEGRATION_DB === "true" &&
  Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("billing tenant DB integration", () => {
  let prisma: typeof import("@/lib/prisma").prisma;
  let assertCanViewBillingInvoice: typeof import("@/lib/billing/access").assertCanViewBillingInvoice;
  let assertCanManageBillingOrganisation: typeof import("@/lib/billing/access").assertCanManageBillingOrganisation;
  let BillingAccessError: typeof import("@/lib/billing/access").BillingAccessError;

  const ids = {
    userA: "",
    userB: "",
    orgA: "",
    orgB: "",
    invoiceA: "",
  };

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({
      assertCanViewBillingInvoice,
      assertCanManageBillingOrganisation,
      BillingAccessError,
    } = await import("@/lib/billing/access"));

    const suffix = Date.now();
    const userA = await prisma.user.create({
      data: {
        email: `idor-a-${suffix}@mapable.local`,
        name: "IDOR A",
        primaryRole: "participant",
        passwordHash: "unused",
      },
    });
    const userB = await prisma.user.create({
      data: {
        email: `idor-b-${suffix}@mapable.local`,
        name: "IDOR B",
        primaryRole: "participant",
        passwordHash: "unused",
      },
    });
    const provA = await prisma.user.create({
      data: {
        email: `idor-pa-${suffix}@mapable.local`,
        name: "IDOR Provider A",
        primaryRole: "provider_admin",
        passwordHash: "unused",
      },
    });
    const provB = await prisma.user.create({
      data: {
        email: `idor-pb-${suffix}@mapable.local`,
        name: "IDOR Provider B",
        primaryRole: "provider_admin",
        passwordHash: "unused",
      },
    });
    const orgA = await prisma.organisation.create({
      data: {
        name: `IDOR Org A ${suffix}`,
        organisationType: "care_provider",
      },
    });
    const orgB = await prisma.organisation.create({
      data: {
        name: `IDOR Org B ${suffix}`,
        organisationType: "care_provider",
      },
    });
    await prisma.organisationMember.createMany({
      data: [
        {
          userId: provA.id,
          organisationId: orgA.id,
          role: "provider_admin",
        },
        {
          userId: provB.id,
          organisationId: orgB.id,
          role: "provider_admin",
        },
      ],
    });
    const invoice = await prisma.billingInvoice.create({
      data: {
        userId: userA.id,
        providerId: orgA.id,
        serviceType: "care",
        status: "issued",
        invoiceNumber: `IDOR-${suffix}`,
        subtotalCents: 1000,
        totalCents: 1000,
        lineItems: {
          create: {
            description: "IDOR line",
            quantity: 1,
            unitAmountCents: 1000,
            totalCents: 1000,
          },
        },
      },
    });

    ids.userA = userA.id;
    ids.userB = userB.id;
    ids.orgA = orgA.id;
    ids.orgB = orgB.id;
    ids.invoiceA = invoice.id;

    // stash provider ids on process for assertions
    (globalThis as { __idor?: Record<string, string> }).__idor = {
      provA: provA.id,
      provB: provB.id,
    };
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.billingInvoiceLineItem.deleteMany({
      where: { invoiceId: ids.invoiceA },
    });
    await prisma.billingInvoice.deleteMany({
      where: { id: ids.invoiceA },
    });
    await prisma.organisationMember.deleteMany({
      where: { organisationId: { in: [ids.orgA, ids.orgB] } },
    });
    await prisma.organisation.deleteMany({
      where: { id: { in: [ids.orgA, ids.orgB] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "@mapable.local" },
        name: { startsWith: "IDOR" },
      },
    });
    await prisma.$disconnect();
  });

  it("prevents cross-participant invoice read", async () => {
    await expect(
      assertCanViewBillingInvoice(
        {
          id: ids.userB,
          email: "b@x",
          name: "B",
          phone: null,
          timezone: "Australia/Sydney",
          locale: "en-AU",
          primaryRole: "participant",
          roles: ["participant"],
        },
        ids.invoiceA
      )
    ).rejects.toBeInstanceOf(BillingAccessError);
  });

  it("prevents cross-org provider manage", async () => {
    const provB = (globalThis as { __idor?: Record<string, string> }).__idor
      ?.provB as string;
    await expect(
      assertCanManageBillingOrganisation(
        {
          id: provB,
          email: "pb@x",
          name: "PB",
          phone: null,
          timezone: "Australia/Sydney",
          locale: "en-AU",
          primaryRole: "provider_admin",
          roles: ["provider_admin"],
        },
        ids.orgA
      )
    ).rejects.toBeInstanceOf(BillingAccessError);
  });
});
