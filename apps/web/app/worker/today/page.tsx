import { startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

import { WorkerShiftOffers } from "@/components/care/WorkerShiftOffers";
import { requirePermission } from "@/lib/auth/guards";
import { workerProfileForUser } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export default async function WorkerTodayPage() {
  const user = await requirePermission("care:shift:work");
  const profile = await workerProfileForUser(user.id);
  if (!profile) {
    return (
      <p className="text-muted-foreground">
        No worker profile linked to your account. Contact your provider admin.
      </p>
    );
  }

  const now = new Date();
  const [shifts, offers] = await Promise.all([
    prisma.careShift.findMany({
      where: {
        workerProfileId: profile.id,
        startAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      orderBy: { startAt: "asc" },
      include: { careRequest: { select: { title: true } } },
    }),
    prisma.shiftOffer.findMany({
      where: {
        workerProfileId: profile.id,
        status: "awaiting_worker",
        expiresAt: { gt: now },
      },
      include: {
        careShift: {
          select: {
            startAt: true,
            careRequest: { select: { title: true } },
          },
        },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Today&apos;s shifts</h1>
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id}>
            <Link
              href={`/worker/shifts/${s.id}`}
              className="block rounded-xl border p-4"
            >
              <span className="font-medium">{s.careRequest.title}</span>
              <span className="block text-sm text-muted-foreground">
                {s.startAt.toLocaleTimeString()} — {s.status}
              </span>
            </Link>
          </li>
        ))}
        {shifts.length === 0 ? (
          <li className="text-sm text-muted-foreground">No shifts scheduled today.</li>
        ) : null}
      </ul>
      <WorkerShiftOffers
        offers={offers.map((offer) => ({
          id: offer.id,
          title: offer.careShift.careRequest.title,
          startsAt: offer.careShift.startAt.toISOString(),
          expiresAt: offer.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
