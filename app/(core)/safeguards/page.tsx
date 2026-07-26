import { listActiveSafeguards } from "@/lib/governance/constitutional-safeguards/safeguards-service";

export default async function SafeguardsPage() {
  const articles = await listActiveSafeguards();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Platform constitutional safeguards</h1>
      <p className="text-muted-foreground">
        Operating principles — not a substitute for legal compliance or statute.
      </p>
      <ol className="list-decimal space-y-4 pl-5">
        {articles.map((a) => (
          <li key={a.id}>
            <strong>{a.title}</strong>
            <p className="text-sm">{a.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
