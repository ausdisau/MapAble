import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgenticMarketplaceLab } from "@/components/marketplace/AgenticMarketplaceLab";
import { requireAuth } from "@/lib/auth/guards";
import { canOpenLab, readLabGate } from "@/lib/marketplace/agentic-lab/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "MapAble+ Agentic Marketplace research sandbox",
  description: "Restricted synthetic marketplace prototype. No real services, payments or agent communications.",
  robots: { index: false, follow: false },
};

export default async function AgenticLabPage() {
  const gate = readLabGate();
  if (!gate.enabled) notFound();
  const user = await requireAuth();
  if (!canOpenLab(user, gate)) notFound();

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-7xl bg-[#f2f6f8] px-4 py-8 text-[#10283b] sm:px-8">
      <AgenticMarketplaceLab />
    </main>
  );
}
