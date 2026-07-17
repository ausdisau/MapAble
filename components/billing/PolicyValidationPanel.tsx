import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  mapableEyebrowBadgeClass,
  mapableEyebrowBadgeSecondaryClass,
  mapableSectionCardClass,
} from "@/lib/brand/styles";
import type { PolicyValidationResult } from "@/types/billing";

const STATUS_COPY: Record<PolicyValidationResult["status"], string> = {
  ok: "Passed policy checks",
  POLICY_REVIEW_REQUIRED: "Needs pricing policy review",
  FAILED: "Failed policy validation",
};

export function PolicyValidationPanel({
  result,
  className,
}: {
  result: PolicyValidationResult | null;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="policy-validation-heading"
      className={cn(mapableSectionCardClass, "p-5", className)}
    >
      <h2
        id="policy-validation-heading"
        className="text-lg font-black text-[#0C1833]"
      >
        Policy validation
      </h2>

      {!result ? (
        <p className="mt-2 text-sm text-slate-600">
          No validation result yet. Run policy checks before issuing.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                result.ok
                  ? mapableEyebrowBadgeSecondaryClass
                  : mapableEyebrowBadgeClass
              )}
            >
              {result.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-sm text-slate-700">
              {STATUS_COPY[result.status]}
            </span>
          </div>

          {result.policyVersionId ? (
            <p className="text-sm text-slate-600">
              Policy version:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-xs">
                {result.policyVersionId}
              </code>
            </p>
          ) : null}

          <p className="text-sm text-slate-700">
            Caps exceeded:{" "}
            <span className="font-semibold">
              {result.capsExceeded ? "Yes — review required" : "No"}
            </span>
          </p>

          {result.messages.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {result.messages.map((msg, i) => (
                <li key={`${i}-${msg}`}>{msg}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No additional messages.</p>
          )}
        </div>
      )}
    </section>
  );
}
