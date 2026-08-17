import Link from "next/link";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata = {
  title: "Coming soon | MapAble",
};

export function ModuleComingSoonPage({
  moduleName,
  description,
}: {
  moduleName: string;
  description: string;
}) {
  return (
    <MapAbleCareMarketingShell>
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-12 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">MapAble</p>
        <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
          {moduleName}
        </h1>
        <p className="text-base leading-8 text-slate-600">{description}</p>
        <p className="text-sm leading-7 text-slate-600">
          This module is not available in the web app yet. You can still find care, transport, jobs
          and accessible places from the homepage.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white hover:bg-[#004766]"
          >
            Back to homepage
          </Link>
          <Link
            href="/provider-finder"
            className="inline-flex min-h-11 items-center rounded-2xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] hover:bg-slate-50"
          >
            Find support
          </Link>
        </div>
      </div>
    </MapAbleCareMarketingShell>
  );
}
