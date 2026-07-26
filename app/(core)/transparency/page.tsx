import { listPublicTransparency } from "@/lib/public/transparency/transparency-service";

export default async function TransparencyHubPage() {
  const publications = await listPublicTransparency();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Public transparency</h1>
      <p className="text-muted-foreground">
        Approved aggregate governance information only.
      </p>
      <ul className="space-y-4">
        {publications.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm">{p.body}</p>
            {p.publishedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Published {p.publishedAt.toLocaleDateString("en-AU")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
