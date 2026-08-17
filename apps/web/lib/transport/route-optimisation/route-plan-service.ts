import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function planFromTransportBooking(
  transportBookingId: string,
  actorUserId: string
) {
  if (!phase5Config.routeOptimisationEnabled) {
    return { skipped: true, message: "Route optimisation disabled" };
  }

  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const plan = await prisma.routePlan.create({
    data: {
      transportBookingId,
      status: "review_required",
      createdById: actorUserId,
    },
  });

  await prisma.routeStop.createMany({
    data: [
      { routePlanId: plan.id, sequence: 1, label: "Pickup", address: tb.pickupAddress },
      { routePlanId: plan.id, sequence: 2, label: "Drop-off", address: tb.dropoffAddress },
    ],
  });

  const reqs = (tb.vehicleRequirements as Record<string, boolean>) ?? {};
  if (reqs.requiresWheelchairAccessible) {
    await prisma.routeConstraint.create({
      data: {
        routePlanId: plan.id,
        type: "wheelchair_accessible_vehicle_required",
        description: "Wheelchair accessible vehicle required",
      },
    });
  }

  const estimates = [25, 35, 45];
  for (let i = 0; i < estimates.length; i++) {
    await prisma.routePlanCandidate.create({
      data: {
        routePlanId: plan.id,
        summary: `Route option ${i + 1} — placeholder estimate ${estimates[i]} minutes`,
        riskNotes:
          i === 0
            ? "Shortest time — verify boarding time is sufficient"
            : "Alternative timing",
        score: 1 - i * 0.1,
      },
    });
    await prisma.travelTimeEstimate.create({
      data: {
        routePlanId: plan.id,
        minutes: estimates[i],
        source: phase5Config.routeProvider === "disabled" ? "placeholder" : "provider",
      },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "route.plan_generated",
    entityType: "RoutePlan",
    entityId: plan.id,
  });

  return plan;
}

export async function selectRoutePlan(
  routePlanId: string,
  candidateId: string,
  actorUserId: string
) {
  const candidate = await prisma.routePlanCandidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw new Error("NOT_FOUND");

  await prisma.routePlan.update({
    where: { id: routePlanId },
    data: { status: "selected" },
  });

  await prisma.routePlanDecision.create({
    data: {
      routePlanId,
      decidedById: actorUserId,
      outcome: "selected",
    },
  });

  const plan = await prisma.routePlan.findUnique({
    where: { id: routePlanId },
  });
  if (plan?.transportBookingId) {
    await prisma.transportBooking.update({
      where: { id: plan.transportBookingId },
      data: { pickupNotes: `Route plan selected: ${candidate.summary}` },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "route.plan_selected",
    entityType: "RoutePlan",
    entityId: routePlanId,
  });

  return plan;
}
