import { requireAuth } from "@/lib/auth/guards";
import { YPIRAC_CAUTION } from "@/lib/careos/opportunities/scheme-coordination";

export const metadata = { title: "Lifespan liaison | Coordinator" };

export default async function LifespanLiaisonPage() {
  await requireAuth();

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-4">
      <header>
        <h1 className="font-heading text-3xl font-bold">
          Lifespan &amp; Support at Home liaison
        </h1>
        <p className="mt-2 text-muted-foreground">
          Record human-authored navigation briefs between NDIS, foundational
          supports, and Support at Home. CareOS does not determine eligibility or
          aged-care placement.
        </p>
      </header>

      <aside
        className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
        role="note"
      >
        {YPIRAC_CAUTION}
      </aside>

      <p className="text-sm">
        Create briefs via{" "}
        <code className="text-xs">POST /api/coordinator/lifespan-liaison</code>{" "}
        and scheme tags via{" "}
        <code className="text-xs">POST /api/coordinator/scheme-brief</code>.
        Every consequential brief should reference an authority decision when
        acting for a participant.
      </p>
    </section>
  );
}
