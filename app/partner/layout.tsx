import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { PartnerNav } from "@/components/layout/PartnerNav";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth/guards";
import { resolvePartnerTierLabel } from "@/lib/partner/portal/partner-tier";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

/**
 * Secure Partner Portal shell.
 * Auth-gated; sidebar navigation + tier badge in the header.
 *
 * TODO: tighten with a partner-specific permission (e.g. partner_portal:access)
 * once Partner API Program enrollment is enforced for all portal users.
 */
export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const tierLabel = await resolvePartnerTierLabel(user.id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#partner-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to partner portal content
      </a>

      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside
          className="hidden w-72 shrink-0 border-r border-border/60 bg-card md:block"
          aria-label="Partner portal sidebar"
        >
          <PartnerNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="space-y-1">
                <h1 className="font-heading text-lg font-bold text-[#005B7F]">
                  Partner Portal
                </h1>
                <Badge variant="default" aria-label={`Partner tier: ${tierLabel}`}>
                  {tierLabel}
                </Badge>
              </div>
              <MapAbleUserBar
                userName={user.name}
                role={user.primaryRole as UserRole}
              />
            </div>

            {/* Mobile nav — compact horizontal destinations */}
            <div className="border-t border-border/60 md:hidden">
              <PartnerNav variant="mobile" />
            </div>
          </header>

          <main id="partner-main" className="flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
