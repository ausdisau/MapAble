import Link from "next/link";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { TransportWorkspaceNav } from "@/components/transport/TransportWorkspaceNav";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessParticipantTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transport Access Profile | MapAble Transport",
  description:
    "Maintain mobility, boarding, assistance, and communication preferences for accessible transport.",
};

/**
 * Lightweight shell for the Transport Access Profile.
 * Full profile CRUD arrives in Prompt 7 — no fake profile data here.
 */
export default async function TransportProfileShellPage() {
  const user = await requireAuth();

  if (!canAccessParticipantTransport(user)) {
    return (
      <TransportAccessDenied
        title="Transport Access Profile is not available for this account"
        description="Only participants (and authorised delegates in later prompts) can manage a Transport Access Profile."
      />
    );
  }

  return (
    <>
      <TransportWorkspaceNav activeHref="/transport/profile" />
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-10 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Coming next
          </p>
          <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
            Transport Access Profile
          </h1>
          <p className="text-sm leading-7 text-slate-600">
            This workspace will let you save mobility, boarding, assistance,
            communication, sensory, companion, and service-animal preferences
            without sharing a diagnosis. The full editor is not available in
            this prompt.
          </p>
        </header>

        <div
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          role="status"
        >
          <p className="text-sm leading-7 text-slate-700">
            Today you can still describe mobility needs on each trip request.
            Profile save, consent revision, and Access Pass summary ship in a
            later transport prompt.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/transport/request"
            className="inline-flex min-h-11 items-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white hover:bg-[#004766] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Request a trip
          </Link>
          <Link
            href="/transport/dashboard"
            className="inline-flex min-h-11 items-center rounded-2xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C1833]"
          >
            My trips
          </Link>
        </div>
      </div>
    </>
  );
}
