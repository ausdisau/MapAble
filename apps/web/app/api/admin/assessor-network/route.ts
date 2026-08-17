import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getAssessorNetworkDirectory,
  registerAssessorNetworkMember,
} from "@/lib/assessor/network/network-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ members: await getAssessorNetworkDirectory() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const member = await registerAssessorNetworkMember(body);
  return jsonOk({ member }, 201);
}
