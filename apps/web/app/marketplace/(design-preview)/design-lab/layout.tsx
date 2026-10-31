import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { isCommerceDesignLabEnabled } from "@/lib/marketplace/design-lab-gate";

/** A synthetic, authenticated UI research route, isolated from checkout. */
export default async function CommerceDesignPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCommerceDesignLabEnabled()) notFound();
  await requireAuth();

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <header className="border-b border-[#d8e0ef] bg-white">
        <nav aria-label="MapAble design preview" className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Link href="/marketplace" className="font-extrabold text-[#073F97] underline-offset-4 hover:underline">
            MapAble Marketplace
          </Link>
          <span className="rounded-full bg-[#fff1e3] px-3 py-1 text-xs font-bold text-[#7a410b]">
            Synthetic design preview
          </span>
          <Link href="/core" className="ml-auto text-sm font-semibold text-[#073F97] underline-offset-4 hover:underline">
            Back to MapAble Core
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
