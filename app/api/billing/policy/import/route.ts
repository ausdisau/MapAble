import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { importPolicySchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:manage_policy");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = importPolicySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const policy = await prisma.pricingPolicy.create({
      data: {
        name: parsed.data.name,
        jurisdiction: parsed.data.jurisdiction ?? "AU",
        organisationId: parsed.data.organisationId ?? undefined,
        sourceUrl: parsed.data.sourceUrl ?? undefined,
        notes: parsed.data.notes ?? undefined,
        versions: {
          create: {
            version: parsed.data.version,
            effectiveFrom: new Date(parsed.data.effectiveFrom),
            effectiveTo: parsed.data.effectiveTo
              ? new Date(parsed.data.effectiveTo)
              : undefined,
            status: "draft",
            sourceUrl: parsed.data.sourceUrl ?? undefined,
            notes: parsed.data.notes ?? undefined,
            rules: {
              create: parsed.data.rules.map((rule) => ({
                supportItemNumber: rule.supportItemNumber,
                supportItemName: rule.supportItemName,
                unit: rule.unit,
                priceCapCents: rule.priceCapCents,
                supportCategory: rule.supportCategory ?? undefined,
                registrationGroup: rule.registrationGroup ?? undefined,
                weekdayOrTimeBand: rule.weekdayOrTimeBand ?? undefined,
                remoteLoading: rule.remoteLoading ?? undefined,
                providerType: rule.providerType ?? undefined,
                gstTreatment: rule.gstTreatment ?? "input_taxed",
                notes: rule.notes ?? undefined,
                status: "verified",
              })),
            },
          },
        },
      },
      include: {
        versions: {
          include: { rules: true },
        },
      },
    });

    const version = policy.versions[0];
    await writeFinancialAudit({
      organisationId: parsed.data.organisationId,
      actorId: user.id,
      actorRole: user.primaryRole,
      action: "pricing_policy_imported",
      entityType: "PricingPolicy",
      entityId: policy.id,
      newValues: {
        versionId: version?.id,
        version: parsed.data.version,
        ruleCount: parsed.data.rules.length,
      },
    });

    return jsonOk({ policy }, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Import policy failed",
      400
    );
  }
}
