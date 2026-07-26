import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildCaseCopilotPack } from "@/lib/ai/case-copilot";
import type { CaseSnapshot } from "@/lib/cases/ai/types";
import { caseCopilotConfig } from "@/lib/config/case-copilot";

/**
 * Accepts a CaseSnapshot projection body for controlled/demo use.
 * Production wiring should load the snapshot server-side with tenant checks.
 */
export async function POST(req: Request) {
  if (!caseCopilotConfig.enabled) {
    return jsonError("Case Copilot is disabled", 404);
  }

  const user = await requireApiPermission("support:manage:any");
  if (user instanceof Response) return user;

  const body = (await req.json().catch(() => null)) as {
    snapshot?: CaseSnapshot;
  } | null;

  if (!body?.snapshot?.id) {
    return jsonError("snapshot required", 400);
  }

  const snapshot: CaseSnapshot = {
    ...body.snapshot,
    openedAt: new Date(body.snapshot.openedAt),
    dueAt: body.snapshot.dueAt ? new Date(body.snapshot.dueAt) : null,
    closedAt: body.snapshot.closedAt ? new Date(body.snapshot.closedAt) : null,
    notes: (body.snapshot.notes ?? []).map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    })),
    tasks: (body.snapshot.tasks ?? []).map((t) => ({
      ...t,
      dueAt: t.dueAt ? new Date(t.dueAt) : null,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    })),
  };

  const pack = buildCaseCopilotPack(snapshot);
  if ("disabled" in pack) {
    return jsonError(pack.reason, 404);
  }

  return jsonOk({
    pack,
    notice:
      "Draft only. Case status was not changed. Human review required before any use.",
  });
}
