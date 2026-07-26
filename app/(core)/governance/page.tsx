import { getActiveCharter } from "@/lib/governance/charter/charter-service";

export default async function GovernanceCharterPage() {
  const charter = await getActiveCharter();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Governance charter</h1>
      {charter ? (
        <article className="prose prose-sm max-w-none">
          <h2>{charter.title}</h2>
          <p className="text-xs text-muted-foreground">
            Version {charter.version}
            {charter.ratifiedAt
              ? ` — ratified ${charter.ratifiedAt.toLocaleDateString("en-AU")}`
              : ""}
          </p>
          <p className="whitespace-pre-wrap">{charter.body}</p>
        </article>
      ) : (
        <p className="text-muted-foreground">
          No ratified charter published yet. Draft versions are managed in admin.
        </p>
      )}
    </div>
  );
}
