"use client";

import Link from "next/link";

import {
  formatFeatureMeasurements,
  operationalStatusLabel,
  statusTrustLabel,
} from "@/lib/access/floor-plan/accessibility-utils";
import { getFeatureConfig } from "@/lib/access/floor-plan/feature-config";
import type { FloorConnector, FloorPlanFeature } from "@/lib/access/floor-plan/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type FloorPlanFeatureDetailsProps = {
  feature: FloorPlanFeature;
  floorName: string;
  connector?: FloorConnector;
  onViewConnectorFloor?: (floorPlanId: string, featureId?: string) => void;
  reportHref?: string;
  onClose?: () => void;
};

export function FloorPlanFeatureDetails({
  feature,
  floorName,
  connector,
  onViewConnectorFloor,
  reportHref,
  onClose,
}: FloorPlanFeatureDetailsProps) {
  const config = getFeatureConfig(feature.type);
  const measurements = formatFeatureMeasurements(feature);

  return (
    <aside
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label={`Details for ${feature.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-black text-[#0C1833]">{feature.name}</h3>
        {onClose ? (
          <button
            type="button"
            className={`min-h-11 min-w-11 rounded-lg border border-slate-300 px-2 text-sm ${mapableCareFocusRing}`}
            onClick={onClose}
            aria-label="Close feature details"
          >
            ✕
          </button>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-slate-600">
        {config.label} · {floorName}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="font-semibold">Verification</dt>
          <dd>{statusTrustLabel(feature.status)}</dd>
        </div>
        {feature.operationalStatus ? (
          <div>
            <dt className="font-semibold">Operational status</dt>
            <dd>{operationalStatusLabel(feature.operationalStatus)}</dd>
          </div>
        ) : null}
        {feature.description ? (
          <div>
            <dt className="font-semibold">Description</dt>
            <dd>{feature.description}</dd>
          </div>
        ) : null}
        {feature.lastVerifiedAt ? (
          <div>
            <dt className="font-semibold">Last verified</dt>
            <dd>{feature.lastVerifiedAt}</dd>
          </div>
        ) : null}
      </dl>

      {measurements.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Measurements</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {measurements.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">Measurements: Not recorded</p>
      )}

      {feature.notes && feature.notes.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
          {feature.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {connector && onViewConnectorFloor ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">{connector.name} connects floors</p>
          {connector.connectedFloorPlanIds
            .filter((id) => id !== feature.floorPlanId)
            .map((floorId) => (
              <button
                key={floorId}
                type="button"
                className={`min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                onClick={() => onViewConnectorFloor(floorId, feature.id)}
              >
                View {connector.name} on connected floor
              </button>
            ))}
        </div>
      ) : null}

      {reportHref ? (
        <Link
          href={reportHref}
          className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-black ${mapableCareFocusRing}`}
        >
          Report incorrect floor plan information
        </Link>
      ) : null}
    </aside>
  );
}
