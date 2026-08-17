import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ParticipantTimesheetsPage() {
  const user = await requireAuth();
  const timesheets = await prisma.timesheet.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Your support records</h1>
      <p className="text-muted-foreground">
        Review completed support in plain language. Approve or dispute submitted
        records.
      </p>
      <ul className="space-y-3">
        {timesheets.map((t) => (
          <li key={t.id} className="rounded-lg border p-4">
            <Link
              href={`/dashboard/timesheets/${t.id}`}
              className="font-medium text-primary underline"
            >
              {t.scheduledStart.toLocaleDateString("en-AU")} — {t.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
