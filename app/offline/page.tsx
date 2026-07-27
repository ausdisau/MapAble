import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata = {
  title: "Offline | MapAble",
  description: "You are offline. Review previously cached venue accessibility details.",
};

export default function OfflinePage() {
  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-16">
        <h1 className="text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
          You are offline
        </h1>
        <p className="text-slate-600 leading-7">
          MapAble can still show venue accessibility details you searched
          earlier on this device. Reconnect for live map tiles and fresh search
          results. Participant records and communication passports are not
          cached.
        </p>
        <Link
          href="/accessibility-map"
          className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
        >
          Open Accessibility Map
        </Link>
      </main>
    </MapAbleCareMarketingShell>
  );
}
