import { notFound } from "next/navigation";

import { MapAbleIdReadOnly } from "@/components/identity/MapAbleIdReadOnly";
import { requireAuth } from "@/lib/auth/guards";
import { isMapAbleIdReadOnlyEnabled } from "@/lib/identity/mapableid-read-flag";
import { readOwnMapAbleIdSnapshot } from "@/lib/identity/mapableid-read-service";

export const metadata = {
  title: "My MapAbleID | MapAble",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MapAbleIdPage() {
  if (!isMapAbleIdReadOnlyEnabled()) notFound();
  const actor = await requireAuth();

  try {
    const snapshot = await readOwnMapAbleIdSnapshot(actor);
    return <MapAbleIdReadOnly snapshot={snapshot} />;
  } catch {
    return (
      <section className="space-y-4" aria-labelledby="identity-unavailable-heading">
        <h1 id="identity-unavailable-heading" className="text-2xl font-bold">
          Your MapAbleID summary is unavailable
        </h1>
        <p role="status">
          We could not safely load your account metadata. Your account has not
          been changed. You can retry later or contact MapAble support.
        </p>
        <a
          href="/dashboard/safety/support"
          className="inline-flex min-h-11 items-center font-semibold text-[#005B7F] underline underline-offset-4"
        >
          Contact support
        </a>
      </section>
    );
  }
}
