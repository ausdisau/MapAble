import { mapableSectionCardClass } from "@/lib/brand/styles";
import { PEERS_PRINCIPLES } from "@/lib/community/mapable-peers/copy";

export function PeersPrincipleList() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {PEERS_PRINCIPLES.map((principle, index) => (
        <li key={principle.id} className={mapableSectionCardClass}>
          <article className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Principle {index + 1}
            </p>
            <h3 className="mt-1 font-heading text-lg font-semibold">{principle.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{principle.body}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
