import { listPublishedAccreditation } from "@/lib/access/accreditation-public-program/public-accreditation-service";

export default async function PublicAccreditationPage() {
  const profiles = await listPublishedAccreditation();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Accessibility accreditation</h1>
      <p className="text-muted-foreground">
        Published profiles only. Not legal certification unless explicitly stated.
      </p>
      <ul className="space-y-4">
        {profiles.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{p.title}</h2>
            <p className="text-sm">{p.summary}</p>
            <p className="mt-2 text-xs italic">{p.disclaimer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
