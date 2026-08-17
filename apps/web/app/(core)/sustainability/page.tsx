import { listPublishedSustainabilityMilestones } from "@/lib/platform/institutional-permanence/permanence-service";

export default async function SustainabilityPage() {
  const milestones = await listPublishedSustainabilityMilestones();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Sustainability milestones</h1>
      <p className="text-muted-foreground">Environmental and governance milestones — read-only.</p>
      <ul className="space-y-3">
        {milestones.map((m, i) => (
          <li key={`${m.planTitle}-${m.milestoneTitle}-${i}`} className="rounded border p-3 text-sm">
            <strong>{m.milestoneTitle}</strong>
            <p className="text-muted-foreground">{m.planTitle}</p>
            {m.targetYear ? (
              <p className="text-xs">Target year: {m.targetYear}</p>
            ) : null}
            <p className="text-xs">{m.completed ? "Completed" : "In progress"}</p>
          </li>
        ))}
        {milestones.length === 0 ? (
          <li className="text-sm text-muted-foreground">No milestones available.</li>
        ) : null}
      </ul>
    </div>
  );
}
