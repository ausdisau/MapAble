import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  approveCommunityMember,
  listAllMemberships,
  registerCommunityMember,
  renewCommunityMember,
  revokeCommunityMember,
} from "@/lib/governance/community-membership/membership-service";

export async function GET() {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  return jsonOk({ members: await listAllMemberships() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "approve") {
    const member = await approveCommunityMember(body.membershipId, user.id, body.termMonths);
    return jsonOk({ member });
  }

  if (body.action === "revoke") {
    const member = await revokeCommunityMember(body.membershipId, user.id);
    return jsonOk({ member });
  }

  if (body.action === "renew") {
    const member = await renewCommunityMember(body.membershipId, user.id, body.termMonths);
    return jsonOk({ member });
  }

  const member = await registerCommunityMember(body);
  return jsonOk({ member }, 201);
}
