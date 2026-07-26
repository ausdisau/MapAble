import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  addEcosystemEntry,
  getPartnerConcentrationMetrics,
  listCertifiedApiEcosystem,
  promoteCertifiedApplicationToEcosystem,
  renewEcosystemEntry,
  revokeEcosystemEntry,
} from "@/lib/api/certified-ecosystem/ecosystem-service";

export async function GET() {
  const user = await requireApiAdminScope("api_certification:manage");
  if (user instanceof Response) return user;
  const { disabled, entries } = await listCertifiedApiEcosystem();
  const concentration = await getPartnerConcentrationMetrics();
  return jsonOk({ disabled, entries, concentration });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("api_certification:manage");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "promote") {
    const entry = await promoteCertifiedApplicationToEcosystem(
      body.applicationId,
      user.id
    );
    return jsonOk({ entry }, 201);
  }

  if (body.action === "revoke") {
    const entry = await revokeEcosystemEntry(
      body.entryId,
      user.id,
      body.revokedReason ?? "Revoked"
    );
    return jsonOk({ entry });
  }

  if (body.action === "renew") {
    const entry = await renewEcosystemEntry(body.entryId, user.id);
    return jsonOk({ entry });
  }

  const entry = await addEcosystemEntry(body);
  return jsonOk({ entry }, 201);
}
