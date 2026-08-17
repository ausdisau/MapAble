import Link from "next/link";
import { redirect } from "next/navigation";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessDriverTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Driver workspace | MapAble Transport",
  description:
    "Mobile-first field view for assigned accessible transport trips.",
};

/**
 * Pack entry for the driver workspace.
 * Canonical trip list remains under /driver/trips.
 * Query ?stay=1 keeps a lightweight shell instead of redirecting.
 */
export default async function TransportDriverShellPage({
  searchParams,
}: {
  searchParams: Promise<{ stay?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  if (!canAccessDriverTransport(user)) {
    return (
      <TransportAccessDenied
        title="Driver workspace unavailable"
        description="This area is for assigned transport drivers. Participants should request a trip from the participant workspace. Operators should use the operator workspace."
        secondaryHref="/transport/request"
        secondaryLabel="Request transport"
      />
    );
  }

  if (params.stay !== "1") {
    redirect("/driver/trips");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
          Pilot
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
          Driver workspace
        </h1>
        <p className="text-sm leading-7 text-slate-600">
          Open your assigned trips in the driver console. Live GPS, offline
          event queues, and production eligibility claims are not marked
          available on the public site yet. If you are in immediate danger,
          call 000.
        </p>
      </header>
      <Link
        href="/driver/trips"
        className="inline-flex min-h-11 items-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white hover:bg-[#004766] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
      >
        Open my trips
      </Link>
    </div>
  );
}
