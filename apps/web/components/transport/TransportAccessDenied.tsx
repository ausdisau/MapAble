import Link from "next/link";

export function TransportAccessDenied({
  title,
  description,
  primaryHref = "/transport",
  primaryLabel = "Back to Transport overview",
  secondaryHref = "/dashboard",
  secondaryLabel = "Go to dashboard",
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-5 py-12 lg:px-8"
      role="alert"
      aria-labelledby="transport-access-denied-title"
    >
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
        MapAble Transport
      </p>
      <h1
        id="transport-access-denied-title"
        className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]"
      >
        {title}
      </h1>
      <p className="text-base leading-8 text-slate-600">{description}</p>
      <p className="text-sm leading-7 text-slate-600">
        If you believe you should have access, ask your organisation administrator
        to grant the correct transport role or membership. MapAble is not an
        emergency service — call 000 if you are in immediate danger.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="inline-flex min-h-11 items-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white hover:bg-[#004766] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex min-h-11 items-center rounded-2xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C1833]"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
