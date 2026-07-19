import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function BillingPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 space-y-2">
      <h1 className="font-heading text-2xl font-black text-[#0C1833] md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm text-slate-600 md:text-base">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}

export function BillingEmptyState({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2 className="text-lg font-black text-[#0C1833]">{title}</h2>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </section>
  );
}

export function SimulatedIntegrationNote({
  name,
}: {
  name: string;
}) {
  return (
    <p
      role="note"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <span className="font-semibold">{name} is simulated</span> in this
      environment. Actions here do not submit live claims or sync live
      accounting data until a production gateway is connected.
    </p>
  );
}
