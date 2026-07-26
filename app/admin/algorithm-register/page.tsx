import { AlgorithmRegisterActions } from "@/app/admin/algorithm-register/AlgorithmRegisterActions";
import { listAllAlgorithms } from "@/lib/compliance/algorithm-register/register-service";
import { requireAdmin } from "@/lib/auth/guards";
import { ALGORITHM_TRANSPARENCY_DISCLAIMER } from "@/lib/config/y4-civic-platform";

export default async function AlgorithmRegisterAdminPage() {
  await requireAdmin();
  const algorithms = await listAllAlgorithms();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Algorithm register</h1>
      <p className="text-sm text-muted-foreground">
        {ALGORITHM_TRANSPARENCY_DISCLAIMER}
      </p>
      <ul className="space-y-2">
        {algorithms.map((a) => (
          <li key={a.id} className="rounded border p-3">
            {a.name} v{a.version} ({a.status})
            {a.linkedPolicyKey ? (
              <p className="text-xs text-muted-foreground">
                Policy: {a.linkedPolicyKey}
              </p>
            ) : null}
            <AlgorithmRegisterActions algorithmId={a.id} status={a.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
