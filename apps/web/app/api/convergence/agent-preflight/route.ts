import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createAgentPreflightContract,
  createPostImplementationReview,
  type PreflightRequest,
} from "@/lib/platform/convergence-os/agent/preflight";
import { requireConvergenceFeature } from "@/lib/platform/convergence-os/gates";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("agentPreflight");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const contractKey = searchParams.get("contractKey");
  const format = searchParams.get("format");

  if (contractKey) {
    const contract = await prisma.agentImplementationContract.findUnique({
      where: { contractKey },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    });
    if (!contract) return jsonError("Contract not found", 404);
    if (format === "markdown") {
      return new Response(contract.markdownExport ?? "", {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }
    return jsonOk({ contract });
  }

  const contracts = await prisma.agentImplementationContract.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ contracts });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("agentPreflight");
  if (gated) return gated;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    contract?: PreflightRequest;
    contractKey?: string;
    classification?:
      | "expected"
      | "justified_deviation"
      | "undocumented_deviation"
      | "constitutional_violation";
    findings?: Record<string, string | number | boolean | null>;
  };

  if (body.action === "create" && body.contract) {
    const result = await createAgentPreflightContract(body.contract);
    return jsonOk({
      ...result,
      note: "Humans approve; AI cannot raise authority ceiling",
    });
  }

  if (body.action === "review") {
    if (!body.contractKey || !body.classification) {
      return jsonError("contractKey and classification required", 400);
    }
    const review = await createPostImplementationReview({
      contractKey: body.contractKey,
      classification: body.classification,
      findings: body.findings ?? {},
    });
    return jsonOk({ review });
  }

  return jsonError("Unknown action. Use create | review", 400);
}
