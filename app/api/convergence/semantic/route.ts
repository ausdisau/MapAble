import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import {
  recordHumanSemanticDecision,
  seedSemanticCandidates,
} from "@/lib/convergence-os/semantic/resolver";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("semanticResolver");
  if (gated) return gated;

  const candidates = await prisma.semanticOverlapCandidate.findMany({
    orderBy: { candidateKey: "asc" },
  });
  return jsonOk({ candidates });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("semanticResolver");
  if (gated) return gated;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    candidateKey?: string;
    humanDecision?: string;
  };

  if (body.action === "seed") {
    return jsonOk(await seedSemanticCandidates());
  }

  if (body.action === "decide") {
    if (!body.candidateKey || !body.humanDecision) {
      return jsonError("candidateKey and humanDecision required", 400);
    }
    const updated = await recordHumanSemanticDecision({
      candidateKey: body.candidateKey,
      humanDecision: body.humanDecision,
      actorIsHuman: true,
    });
    return jsonOk({ candidate: updated });
  }

  return jsonError("Unknown action. Use seed | decide", 400);
}
