import { mapableSectionCardClass } from "@/lib/brand/styles";
import { PEERS_HERITAGE } from "@/lib/community/mapable-peers/copy";

export function PeersHeritage() {
  return (
    <section className={mapableSectionCardClass} aria-labelledby="peers-heritage-heading">
      <div className="space-y-4 p-6">
        <h2 id="peers-heritage-heading" className="font-heading text-xl font-semibold">
          Standing on earlier meeting places
        </h2>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-primary">EnableNet &amp; portals</dt>
            <dd className="mt-1 text-muted-foreground">{PEERS_HERITAGE.enableNet}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">Disaboom &amp; scale</dt>
            <dd className="mt-1 text-muted-foreground">{PEERS_HERITAGE.disaboom}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">MapAble today</dt>
            <dd className="mt-1 text-muted-foreground">{PEERS_HERITAGE.mapable}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
