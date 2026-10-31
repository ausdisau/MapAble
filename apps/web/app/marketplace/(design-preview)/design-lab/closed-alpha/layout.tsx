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
  if (!isWebAlphaAllowed(user.id, process.env)) notFound();
  return <div>{children}</div>;
}
