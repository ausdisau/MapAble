import Link from "next/link";
import React from "react";

import type { ResourceModuleLink } from "@/lib/canvas/resource-hub-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type ResourceModuleGridProps = {
  modules: ResourceModuleLink[];
  title?: string;
  id?: string;
  description?: string;
};

export function ResourceModuleGrid({
  modules,
  title = "Explore MapAble modules",
  id = "resource-module-links",
  description = "Start with the public modules, discovery tools, and support pathways available during the controlled pilot.",
}: ResourceModuleGridProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-[#F6FBFC]"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Module hub</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
                {module.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-black text-[#0C1833]">
                {module.label}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
