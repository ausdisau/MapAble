import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { seedArchitectureConstitution } from "@/lib/convergence-os/constitution/seed";
import { validateConstitutionAdvisory } from "@/lib/convergence-os/constitution/validate";
import {
  createExceptionDraft,
  transitionException,
} from "@/lib/convergence-os/constitution/exceptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("constitution");
  if (gated) return gated;

  const [constitution, rules, exceptions, violations] = await Promise.all([
    prisma.architectureConstitution.findUnique({
      where: { constitutionKey: "mapable_architecture_constitution" },
      include: { versions: { orderBy: { version: "desc" }, take: 5 } },
    }),
    prisma.architectureRule.findMany({ orderBy: { ruleKey: "asc" } }),
    prisma.architectureRuleException.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rule: { select: { ruleKey: true, title: true } } },
    }),
    prisma.architectureRuleViolation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rule: { select: { ruleKey: true } } },
    }),
  ]);

  return jsonOk({ constitution, rules, exceptions, violations });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("constitution");
  if (gated) return gated;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    ruleKey?: string;
    businessReason?: string;
    exceptionId?: string;
    nextStatus?: string;
    durationDays?: number;
    owner?: string;
  };

  switch (body.action) {
    case "seed": {
      const seeded = await seedArchitectureConstitution();
      return jsonOk({ seeded });
    }
    case "validate": {
      const result = await validateConstitutionAdvisory();
      return jsonOk({ result, advisoryOnly: true });
    }
    case "create_exception": {
      if (!body.ruleKey || !body.businessReason) {
        return jsonError("ruleKey and businessReason required", 400);
      }
      const exception = await createExceptionDraft({
        ruleKey: body.ruleKey,
        businessReason: body.businessReason,
        durationDays: body.durationDays,
        owner: body.owner ?? user.email ?? user.id,
      });
      return jsonOk({ exception, note: "AI cannot approve exceptions" });
    }
    case "transition_exception": {
      if (!body.exceptionId || !body.nextStatus) {
        return jsonError("exceptionId and nextStatus required", 400);
      }
      const exception = await transitionException({
        exceptionId: body.exceptionId,
        nextStatus: body.nextStatus as never,
        actorIsHuman: true,
      });
      return jsonOk({ exception });
    }
    default:
      return jsonError(
        "Unknown action. Use seed | validate | create_exception | transition_exception",
        400
      );
  }
}
