type FloorPlanErrorStateProps = {
  message: string;
  onRetry?: () => void;
  onClose?: () => void;
};

export function FloorPlanErrorState({ message, onRetry, onClose }: FloorPlanErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6" role="alert">
      <p className="font-semibold text-rose-900">{message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            className="min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black"
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}
