import Link from "next/link";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Operations | Admin" };

export default async function AdminOperationsPage() {
  const [openTickets, urgentTickets, awaitingAssign, awaitingProvider, draftInvoices, preflightFailed, pendingDocs, pendingOrgs] = await Promise.all([
    prisma.supportTicket.count({ where: { status: { in: ["open", "triage"] } } }),
    prisma.supportTicket.count({ where: { priority: "urgent" } }),
    prisma.booking.count({ where: { status: "requested", assignedOrganisationId: null } }),
    prisma.booking.count({ where: { providerResponseStatus: "sent" } }),
    prisma.invoice.count({ where: { status: "draft" } }),
    prisma.invoice.count({ where: { status: "preflight_failed" } }),
    prisma.document.count({ where: { scanStatus: "pending" } }),
    prisma.organisation.count({ where: { verificationStatus: "pending_review" } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold">Operations</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard title="Open support tickets" value={openTickets} href="/admin/operations/tickets" />
        <AdminMetricCard title="Urgent tickets" value={urgentTickets} href="/admin/support" />
        <AdminMetricCard title="Bookings awaiting assignment" value={awaitingAssign} href="/admin/operations/bookings" />
        <AdminMetricCard title="Awaiting provider response" value={awaitingProvider} href="/admin/bookings" />
        <AdminMetricCard title="Draft invoices" value={draftInvoices} href="/admin/operations/billing" />
        <AdminMetricCard title="Preflight failed" value={preflightFailed} href="/admin/invoices" />
        <AdminMetricCard title="Documents pending scan" value={pendingDocs} href="/admin/operations/documents" />
        <AdminMetricCard title="Orgs pending verification" value={pendingOrgs} href="/admin/organisations" />
      </div>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/operations/bookings">Bookings ops</Link>
        <Link href="/admin/operations/tickets">Tickets ops</Link>
        <Link href="/admin/operations/billing">Billing ops</Link>
        <Link href="/admin/operations/documents">Documents ops</Link>
      </nav>
    </div>
  );
}
