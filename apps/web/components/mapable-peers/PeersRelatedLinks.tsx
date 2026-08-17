import Link from "next/link";

import { mapableSectionCardClass } from "@/lib/brand/styles";

const LINKS = [
  {
    href: "/access",
    label: "MapAble Access",
    description: "Place-based accessibility reviews and map — evidence, not hot takes.",
  },
  {
    href: "/algorithms",
    label: "Algorithm register",
    description: "Where automated ranking exists elsewhere on MapAble, it is declared here.",
  },
  {
    href: "/governance",
    label: "Governance",
    description: "Institutional accountability — separate from everyday peer conversation.",
  },
  {
    href: "/membership",
    label: "Governance membership",
    description: "Public directory of community governance participants.",
  },
] as const;

export function PeersRelatedLinks() {
  return (
    <nav className={mapableSectionCardClass} aria-labelledby="peers-related-heading">
      <div className="p-6">
        <h2 id="peers-related-heading" className="font-heading text-lg font-semibold">
          Related on MapAble
        </h2>
        <ul className="mt-4 space-y-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg border border-transparent px-2 py-2 hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium text-primary">{link.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
