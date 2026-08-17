import Link from "next/link";
import React from "react";

import type { PolicyResourceLink } from "@/lib/canvas/resource-hub-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type PolicyResourceGridProps = {
  links: PolicyResourceLink[];
  title?: string;
  id?: string;
};

export function PolicyResourceGrid({
  links,
  title = "Policy and safety resources",
  id = "policy-resources",
}: PolicyResourceGridProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-white"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Policy</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
            >
              <h3 className="text-lg font-black text-[#0C1833]">{link.label}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
