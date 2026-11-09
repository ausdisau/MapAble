import Link from "next/link";
import { notFound } from "next/navigation";

import { DecisionWorkbenchPreview } from "@/components/my-support/DecisionWorkbenchPreview";
import { requireAuth } from "@/lib/auth/guards";
import { isMySupportPreviewEnabled } from "@/lib/config/my-support";
import { describeSupportStatus, type SupportRecordKind } from "@/lib/my-support/support-status";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My Support | MapAble" };
export const dynamic = "force-dynamic";

function formatUpdate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(date);
}

function EvidenceList({
  heading,
  kind,
  records,
  href,
}: {
  heading: string;
  kind: SupportRecordKind;
  records: { id: string; status: string; updatedAt: Date }[];
  href: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-heading text-xl font-bold text-[#0C1833]">{heading}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Latest updated records from your MapAble account. These are not independently verified attendance reports.
      </p>
      {records.length === 0 ? (
        <p className="mt-4 text-base text-slate-700">
          No records available here. This does not mean you have no external support arrangements.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {records.map((item) => {
            const evidence = describeSupportStatus(kind, item.status);
            return (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-[#0C1833]">{evidence.label}</p>
                <p className="mt-1 text-sm text-slate-700">{evidence.detail}</p>
                <p className="mt-2 text-xs text-slate-600">Record updated {formatUpdate(item.updatedAt)}</p>
              </li>
            );
          })}
        </ul>
      )}
      <Link href={href} className="mt-5 inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]">
        Review {kind === "care" ? "care bookings" : "transport trips"}
      </Link>
    </section>
  );
}

const CONTROL_LINKS = [
  { href: "/dashboard/consent", title: "My permissions", text: "Review who can access your information, and the scope of each permission." },
  { href: "/dashboard/accessibility", title: "My communication", text: "Review your access and communication preferences." },
  { href: "/dashboard/billing", title: "My money", text: "Examine billing and service evidence; raise a discrepancy." },
  { href: "/dashboard/safety", title: "My rights and safety", text: "Find the complaints, incidents and human support pathways." },
] as const;

export default async function MySupportPage() {
  const user = await requireAuth();
  if (!isMySupportPreviewEnabled()) notFound();

  const [careRecords, tripRecords] = await Promise.all([
    prisma.careBooking.findMany({
      where: { participantId: user.id },
      select: { id: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.transportTrip.findMany({
      where: { participantId: user.id },
      select: { id: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-7 pb-12" data-testid="my-support-page">
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wider text-[#005B7F]">
          Participant workspace · Preview
        </p>
        <h1 className="font-heading text-3xl font-extrabold text-[#0C1833] sm:text-4xl">My Support</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-700">
          My life. My decisions. Review your records, examine choices and decide what
          information to share. Other people must not silently decide for you.
        </p>
      </header>
      <section aria-label="Preview boundaries" className="rounded-2xl border-l-4 border-[#D76B2E] bg-[#FFF8F2] p-5">
        <p className="font-semibold text-[#0C1833]">Your records and the examples below are different things.</p>
        <p className="mt-2 text-base leading-7 text-slate-800">
          Care and transport statuses below come from your signed-in MapAble records.
          They are system entries, not proof of delivery or worker verification.
          The decision exercise is fictional and cannot contact anyone or change real arrangements.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <EvidenceList heading="My care records" kind="care" records={careRecords} href="/care/bookings" />
        <EvidenceList heading="My transport records" kind="transport" records={tripRecords} href="/dashboard/transport" />
      </div>
      <DecisionWorkbenchPreview />
      <section aria-labelledby="my-support-controls-heading">
        <h2 id="my-support-controls-heading" className="font-heading text-2xl font-bold text-[#0C1833]">
          Where I have control
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CONTROL_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="block min-h-32 rounded-xl border border-slate-200 bg-white p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]">
              <span className="block text-lg font-bold text-[#005B7F] underline underline-offset-4">{item.title}</span>
              <span className="mt-2 block text-base leading-6 text-slate-700">{item.text}</span>
            </Link>
          ))}
        </div>
      </section>
      <p className="text-sm leading-6 text-slate-600">
        No automated worker allocation, consent change, invoice approval or support cancellation
        is available from My Support. For urgent danger, use your established emergency and human support channels.
      </p>
    </main>
  );
}
