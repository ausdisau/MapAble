import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";

export const dynamic = "force-dynamic";
const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  state: z.enum(["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

export async function GET(request: Request) {
  if (!checkIpRateLimit(`commission-provider-search:${getClientIp(request)}`, { windowMs: 60_000, max: 40 })) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search filters." }, { status: 400 });
  if (process.env.MAPABLE_COMMISSION_REGISTRY_PUBLIC_ENABLED !== "true") {
    return NextResponse.json({ error: "Commission register search is not enabled.", code: "REGISTRY_DISABLED" }, { status: 503 });
  }
  try {
    const release = await prisma.ndisCommissionRelease.findFirst({
      where: { status: "active" }, select: { id: true, sourceAsOf: true, sourceUrl: true, activatedAt: true },
    });
    if (!release) return NextResponse.json({ error: "No approved Commission registry snapshot is active.", code: "NO_APPROVED_SNAPSHOT" }, { status: 503 });
    const { q, state, limit, page } = parsed.data;
    const where = {
      releaseId: release.id,
      ...(state ? { state } : {}),
      ...(q ? { OR: [
        { legalName: { contains: q, mode: "insensitive" as const } },
        { businessName: { contains: q, mode: "insensitive" as const } },
        { abn: { contains: q.replace(/\s+/g, "") } },
        { registrationNumber: { contains: q } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.ndisCommissionEntry.findMany({
        where, orderBy: [{ legalName: "asc" }, { rowNumber: "asc" }],
        skip: (page - 1) * limit, take: limit,
        select: { rowNumber: true, abn: true, registrationNumber: true, legalName: true, businessName: true, registrationStatus: true, state: true },
      }),
      prisma.ndisCommissionEntry.count({ where }),
    ]);
    return NextResponse.json({
      data: items.map(x => ({
        id: `${release.id}:${x.rowNumber}`,
        name: x.businessName || x.legalName,
        legalName: x.legalName,
        abn: x.abn,
        registrationNumber: x.registrationNumber,
        registration: { status: x.registrationStatus, source: "NDIS Quality and Safeguards Commission", asOf: release.sourceAsOf.toISOString().slice(0,10) },
        state: x.state,
        workerScreening: { status: "not_independently_verified" },
        accessibility: { status: "unknown" },
      })),
      meta: { sourceUrl: release.sourceUrl, releaseId: release.id, sourceAsOf: release.sourceAsOf.toISOString().slice(0,10), total, page, nextPage: page * limit < total ? page + 1 : null },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Commission registry is unavailable.", code: "REGISTRY_UNAVAILABLE" }, { status: 503 });
  }
}
