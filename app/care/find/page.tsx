import Link from "next/link";

import { isCareTransportMapEnabled } from "@/lib/config/care-transport-map";

export default function CareFindPage() {
  const mapEnabled = isCareTransportMapEnabled();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Find care providers</h1>
      <p className="text-muted-foreground">
        Browse registered providers, explore the Care + Transport map, or use
        the provider finder for directory search.
      </p>
      <ul className="space-y-2 text-primary">
        {mapEnabled ? (
          <li>
            <Link href="/care-transport/map" className="underline">
              Open Care + Transport map
            </Link>
          </li>
        ) : (
          <li className="text-muted-foreground">
            Care + Transport map (pilot flag off)
          </li>
        )}
        <li>
          <Link href="/provider-finder" className="underline">
            Open provider finder
          </Link>
        </li>
        <li>
          <Link href="/care/request" className="underline">
            Request care
          </Link>
        </li>
      </ul>
    </div>
  );
}
