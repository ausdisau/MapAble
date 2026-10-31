import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { isWebAlphaAllowed } from "@/lib/marketplace/alpha/web-alpha-access";

/**
 * Server-enforced, closed-alpha participant admission.
 * Parent design-lab layout independently enforces requireAuth and
 * MAPABLE_COMMERCE_DESIGN_LAB_ENABLED default OFF.
 */
export default async function ClosedAlphaLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await requireAuth();
  if (!isWebAlphaAllowed(user.id, {
    MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED:
      process.env.MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED,
    MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS:
      process.env.MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS,
    VERCEL_ENV: process.env.VERCEL_ENV,
  })) notFound();
  return <div>{children}</div>;
}
