"use client";

export function MapLegend() {
  return (
    <div
      className="access-map-legend rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label="Map marker legend"
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-600">
        Marker legend
      </p>
      <ul className="mt-2 space-y-1.5 text-xs">
        <li className="flex items-center gap-2">
          <span
            className="access-map-marker access-map-marker--gold access-map-marker--legend"
            aria-hidden="true"
          >
            <span className="access-map-marker__icon">♿</span>
            <span className="access-map-marker__tier">G</span>
          </span>
          <span>
            <strong>Gold</strong> — highest verified access
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="access-map-marker access-map-marker--silver access-map-marker--legend"
            aria-hidden="true"
          >
            <span className="access-map-marker__icon">♿</span>
            <span className="access-map-marker__tier">S</span>
          </span>
          <span>
            <strong>Silver</strong> — good access
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="access-map-marker access-map-marker--bronze access-map-marker--legend"
            aria-hidden="true"
          >
            <span className="access-map-marker__icon">♿</span>
            <span className="access-map-marker__tier">B</span>
          </span>
          <span>
            <strong>Bronze</strong> — basic access
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="access-map-marker access-map-marker--unverified access-map-marker--legend"
            aria-hidden="true"
          >
            <span className="access-map-marker__icon">♿</span>
            <span className="access-map-marker__tier">U</span>
          </span>
          <span>
            <strong>Unverified</strong> — not yet assessed
          </span>
        </li>
      </ul>
      <p className="mt-2 text-[10px] text-slate-500">
        Markers show tier letter (G/S/B/U) and category letter. Status is not
        indicated by colour alone.
      </p>
    </div>
  );
}
