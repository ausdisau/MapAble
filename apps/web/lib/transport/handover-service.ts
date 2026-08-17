import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  assertAssignedDriver,
  assertCanAccessTrip,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export type HandoverStatus = {
  preStartComplete: boolean;
  pickupHandoverComplete: boolean;
  dropoffHandoverComplete: boolean;
  checks: Array<{
    id: string;
    checkType: string;
    passed: boolean;
    notes: string | null;
    createdAt: string;
  }>;
  handovers: Array<{
    id: string;
    completed: boolean;
    notes: string | null;
    createdAt: string;
  }>;
};

export async function getHandoverStatus(tripId: string): Promise<HandoverStatus> {
  const [checks, handovers] = await Promise.all([
    prisma.transportSafetyCheck.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transportHandoverRecord.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const preStartComplete = checks.some(
    (c) => c.checkType === "pre_start" && c.passed
  );
  const pickupHandoverComplete = handovers.some(
    (h) => h.completed && h.notes?.toLowerCase().startsWith("pickup")
  );
  const dropoffHandoverComplete = handovers.some(
    (h) => h.completed && h.notes?.toLowerCase().startsWith("dropoff")
  );

  return {
    preStartComplete,
    pickupHandoverComplete,
    dropoffHandoverComplete,
    checks: checks.map((c) => ({
      id: c.id,
      checkType: c.checkType,
      passed: c.passed,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    })),
    handovers: handovers.map((h) => ({
      id: h.id,
      completed: h.completed,
      notes: h.notes,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

export async function recordSafetyCheck(
  user: CurrentUser,
  tripId: string,
  input: { checkType: string; passed: boolean; notes?: string }
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip, "summary");
  if (user.primaryRole === "driver") {
    await assertAssignedDriver(user, tripId);
  }

  await prisma.transportSafetyCheck.create({
    data: {
      tripId,
      checkType: input.checkType,
      passed: input.passed,
      notes: input.notes,
      actorUserId: user.id,
    },
  });

  return getHandoverStatus(tripId);
}

export async function recordHandover(
  user: CurrentUser,
  tripId: string,
  input: { phase: "pickup" | "dropoff"; completed: boolean; notes?: string }
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip, "summary");
  if (user.primaryRole === "driver") {
    await assertAssignedDriver(user, tripId);
  }

  const notes = [input.phase, input.notes].filter(Boolean).join(": ");

  await prisma.transportHandoverRecord.create({
    data: {
      tripId,
      completed: input.completed,
      notes: notes || input.phase,
      actorUserId: user.id,
    },
  });

  return getHandoverStatus(tripId);
}
