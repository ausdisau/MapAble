"use client";

import dynamic from "next/dynamic";

const InfrastructurePinPreviewInner = dynamic(
  () =>
    import("@/components/care-transport/InfrastructurePinPreviewInner").then(
      (m) => m.InfrastructurePinPreviewInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-48 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground"
        role="status"
        aria-label="Loading map preview"
      >
        Loading map preview…
      </div>
    ),
  },
);

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function InfrastructurePinPreview({
  latitude,
  longitude,
  label,
}: Props) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return (
    <InfrastructurePinPreviewInner
      latitude={latitude}
      longitude={longitude}
      label={label}
    />
  );
}
