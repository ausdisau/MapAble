import { AuditEventTable } from "@/components/admin/AuditEventTable";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Audit events | Admin" };

export default async function AdminAuditEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;

  const events = await prisma.auditEvent.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actorUser: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Audit events</h1>
        <form className="mt-4 flex gap-2">
          <input
            name="action"
            defaultValue={action}
            placeholder="Filter by action"
            className="min-h-11 rounded-lg border border-input px-3"
          />
          <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
            Filter
          </button>
        </form>
      </header>
      <AuditEventTable events={events} />
    </div>
  );
}
