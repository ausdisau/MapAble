import { AccessPlaceCard, type AccessPlaceCardData } from "@/components/access/AccessPlaceCard";

export function AccessPlaceList({ places }: { places: AccessPlaceCardData[] }) {
  if (!places.length) {
    return (
      <p className="text-muted-foreground" role="status">
        No places match your search. Try a different query or add a place.
      </p>
    );
  }
  return (
    <ul className="space-y-3" aria-label="Place list">
      {places.map((place) => (
        <li key={place.id}>
          <AccessPlaceCard place={place} />
        </li>
      ))}
    </ul>
  );
}
