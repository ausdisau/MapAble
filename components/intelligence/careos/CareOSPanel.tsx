import Link from "next/link";

import { MissionComposer } from "./MissionComposer";

export function CareOSPanel() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">CareOS</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          CareOS helps you coordinate care, transport and access information. It provides suggestions using information you authorise. You remain in control.
        </p>
      </header>
      <MissionComposer />
      <section aria-labelledby="careos-non-ai-heading" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h2 id="careos-non-ai-heading" className="font-heading text-lg font-bold">
          Continue without CareOS
        </h2>
        <p className="mt-1 text-sm">You can use the usual MapAble forms at any time.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="min-h-11 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40" href="/care/new">
            Request care
          </Link>
          <Link className="min-h-11 rounded-lg border px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40" href="/dashboard/transport/new">
            Request transport
          </Link>
        </div>
      </section>
    </div>
  );
}
