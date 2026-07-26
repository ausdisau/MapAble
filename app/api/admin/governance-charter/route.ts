import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  draftGovernanceCharter,
  listCharters,
  ratifyCharter,
} from "@/lib/governance/charter/charter-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ charters: await listCharters() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.version && body.action === "ratify") {
    const charter = await ratifyCharter(body.version);
    return jsonOk({ charter });
  }
  const charter = await draftGovernanceCharter(body);
  return jsonOk({ charter }, 201);
}
