import { cn } from "@/app/lib/utils";

type SensitiveDataBannerProps = {
  className?: string;
  id?: string;
};

/** Inline warning against pasting NDIS plans / clinical records into open forms. */
export function SensitiveDataBanner({ className, id }: SensitiveDataBannerProps) {
  return (
    <aside
      id={id}
      role="note"
      className={cn(
        "rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950",
        className,
      )}
    >
      <p className="font-black">Do not paste sensitive health or NDIS plan details</p>
      <p className="mt-1">
        Avoid unencrypted NDIS plan documents, diagnoses, clinical notes, or full
        participant identifiers in generic message fields. MapAble will invite you
        through a secure, consent-controlled pathway when those records are needed.
      </p>
    </aside>
  );
}
