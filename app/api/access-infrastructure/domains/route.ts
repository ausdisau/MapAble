import { NextResponse } from "next/server";

import {
  ACCESS_DOMAIN_LABELS,
  ACCESS_DOMAINS,
  accessInfrastructureFlags,
} from "@/lib/access/infrastructure";
import { accessIntelligenceNextFlags } from "@/lib/access/intelligence-next";

export const dynamic = "force-dynamic";

/**
 * GET canonical Access Infrastructure domains (twenty functional domains).
 */
export async function GET() {
  const enabled =
    accessInfrastructureFlags.enabled ||
    (accessIntelligenceNextFlags.enabled && accessIntelligenceNextFlags.ontology);

  if (!enabled) {
    return NextResponse.json(
      { error: "Access Infrastructure domains are disabled" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    framework: "access_as_infrastructure",
    productionClaim: "none",
    domains: ACCESS_DOMAINS.map((id) => ({
      id,
      label: ACCESS_DOMAIN_LABELS[id],
    })),
    note: "Domains are functional requirements taxonomies — not impairment categories.",
  });
}
