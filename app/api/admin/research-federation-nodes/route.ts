import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  approveFederationNode,
  listFederationNodes,
  registerFederationNode,
  revokeFederationNode,
  suspendFederationNode,
} from "@/lib/research/federation-at-scale/federation-node-service";

export async function GET() {
  const user = await requireApiAdminScope("federated_research:manage");
  if (user instanceof Response) return user;
  return jsonOk(await listFederationNodes());
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("federated_research:manage");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "approve") {
    const node = await approveFederationNode(body.nodeId, user.id);
    return jsonOk({ node });
  }

  if (body.action === "suspend") {
    const node = await suspendFederationNode(body.nodeId, user.id);
    return jsonOk({ node });
  }

  if (body.action === "revoke") {
    const node = await revokeFederationNode(body.nodeId, user.id);
    return jsonOk({ node });
  }

  const node = await registerFederationNode(body);
  return jsonOk({ node }, 201);
}
