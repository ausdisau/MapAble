type FloorPlanEmptyStateProps = {
  onClose?: () => void;
};

export function FloorPlanEmptyState({ onClose }: FloorPlanEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-8 text-center" role="status">
      <p className="font-semibold text-[#0C1833]">
        No public floor plan is currently available for this venue.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Venue-level accessibility information remains available in the place profile.
      </p>
      {onClose ? (
        <button
          type="button"
          className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black"
          onClick={onClose}
        >
          Return to venue
        </button>
      ) : null}
    </div>
  );
}
