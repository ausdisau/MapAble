/** Server-side, independent sandbox gate. Not a production identity/authorisation service. */
export type LabAccessUser = { readonly id: string; readonly primaryRole: string };
export type LabGate = { readonly enabled: boolean; readonly testers: ReadonlySet<string> };
export function readLabGate(env: Record<string,string|undefined> = process.env): LabGate {
  return {
    enabled: env.MAPABLE_AGENTIC_MARKETPLACE_LAB_ENABLED === "true",
    testers: new Set((env.MAPABLE_AGENTIC_MARKETPLACE_LAB_TESTER_IDS ?? "")
      .split(",").map((id) => id.trim()).filter(Boolean)),
  };
}
export function canOpenLab(user: LabAccessUser | null, gate: LabGate): boolean {
  return Boolean(gate.enabled && user && (user.primaryRole === "mapable_admin" || gate.testers.has(user.id)));
}
