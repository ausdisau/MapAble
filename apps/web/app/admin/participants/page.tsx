import Link from "next/link";

import { logAdminSensitiveAccess } from "@/lib/audit/audit-event-service";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Participants | Admin" };

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  const { q } = await searchParams;

  const profiles = await prisma.participantProfile.findMany({
    where: q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { user: { select: { id: true, email: true, primaryRole: true } } },
    orderBy: { displayName: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Participants</h1>
        <form className="mt-4 flex gap-2">
          <label htmlFor="search" className="sr-only">
            Search participants
          </label>
          <input
            id="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email"
            className="min-h-11 flex-1 rounded-lg border border-input px-3"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
          >
            Search
          </button>
        </form>
      </header>

      <ul className="space-y-2">
        {profiles.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/participants/${p.userId}`}
              className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                void logAdminSensitiveAccess({
                  actorUserId: admin.id,
                  actorRole: admin.primaryRole as never,
                  entityType: "ParticipantProfile",
                  entityId: p.id,
                  participantId: p.userId,
                });
              }}
            >
              <span className="font-medium">{p.displayName}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {p.user.email}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
