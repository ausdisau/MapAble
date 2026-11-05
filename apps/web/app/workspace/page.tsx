import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UnifiedWorkspaceRouter } from "@/components/workspace/UnifiedWorkspaceRouter";
import { requireAdmin } from "@/lib/auth/guards";
import { isWorkspaceRouterEnabled } from "@/lib/workspace/targets";

/** A restricted developer hub, never a public marketing landing page. */
export const metadata: Metadata = {
  title: "Unified Workspace | MapAble",
  description: "Internal MapAble web and native development workspace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!isWorkspaceRouterEnabled(process.env.MAPABLE_WORKSPACE_ROUTER_ENABLED)) {
    notFound();
  }
  await requireAdmin();
  return <UnifiedWorkspaceRouter />;
}
