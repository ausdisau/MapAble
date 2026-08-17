import { prisma } from "@/lib/prisma";

export type PlatformOrganisationLink = {
  organisationId: string;
  organisationName: string;
};

function normalizeAbn(abn: string | null | undefined) {
  if (!abn) return null;
  const digits = abn.replace(/\D/g, "");
  return digits.length >= 9 ? digits : null;
}

/**
 * Resolve a MapAble platform Organisation from NDIS outlet identifiers.
 * Prefer ABN match; fall back to registry slug when present.
 */
export async function resolvePlatformOrganisation(params: {
  abn?: string | null;
  slug?: string | null;
  outletKey?: string | null;
}): Promise<PlatformOrganisationLink | null> {
  const abn = normalizeAbn(params.abn);
  if (abn) {
    const org = await prisma.organisation.findFirst({
      where: { abn, status: "active" },
      select: { id: true, name: true },
    });
    if (org) {
      return { organisationId: org.id, organisationName: org.name };
    }
  }

  if (params.slug) {
    const registry = await prisma.providerOutletRegistry.findFirst({
      where: { slug: params.slug, active: true },
      select: { abn: true },
    });
    const registryAbn = normalizeAbn(registry?.abn);
    if (registryAbn) {
      const org = await prisma.organisation.findFirst({
        where: { abn: registryAbn, status: "active" },
        select: { id: true, name: true },
      });
      if (org) {
        return { organisationId: org.id, organisationName: org.name };
      }
    }
  }

  if (params.outletKey) {
    const registry = await prisma.providerOutletRegistry.findFirst({
      where: { outletKey: params.outletKey, active: true },
      select: { abn: true },
    });
    const registryAbn = normalizeAbn(registry?.abn);
    if (registryAbn) {
      const org = await prisma.organisation.findFirst({
        where: { abn: registryAbn, status: "active" },
        select: { id: true, name: true },
      });
      if (org) {
        return { organisationId: org.id, organisationName: org.name };
      }
    }
  }

  return null;
}

export function buildCareRequestHref(params: {
  organisationId?: string;
  providerName?: string;
  preferredOrganisationName?: string;
}) {
  const search = new URLSearchParams();
  if (params.organisationId) {
    search.set("organisationId", params.organisationId);
  }
  if (params.providerName) {
    search.set("providerName", params.providerName);
  }
  if (params.preferredOrganisationName) {
    search.set("preferredOrganisationName", params.preferredOrganisationName);
  }
  const query = search.toString();
  return query ? `/care/request?${query}` : "/care/request";
}
