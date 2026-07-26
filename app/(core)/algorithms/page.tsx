import { listPublishedAlgorithms } from "@/lib/compliance/algorithm-register/register-service";
import {
  ALGORITHM_TRANSPARENCY_DISCLAIMER,
} from "@/lib/config/y4-civic-platform";

export default async function AlgorithmsPage() {
  const algorithms = await listPublishedAlgorithms();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Public algorithm register</h1>
      <p className="text-muted-foreground">
        {ALGORITHM_TRANSPARENCY_DISCLAIMER}{" "}
        <a href="/peers" className="font-medium text-primary hover:underline">
          MapAble PEERS
        </a>{" "}
        does not use additive feed ranking; discussion rooms stay chronological.
      </p>
      <ul className="space-y-4">
        {algorithms.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">
              {a.name} <span className="text-sm font-normal">v{a.version}</span>
            </h2>
            <p className="text-sm">{a.purpose}</p>
            {a.linkedPolicyKey ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Linked policy: {a.linkedPolicyKey}
              </p>
            ) : null}
            {a.fairnessNotes ? (
              <p className="mt-2 text-xs text-muted-foreground">{a.fairnessNotes}</p>
            ) : null}
            {a.reviewDueAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Next review due: {a.reviewDueAt.toLocaleDateString("en-AU")}
              </p>
            ) : null}
            {a.disputeContact ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Disputes: {a.disputeContact}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
