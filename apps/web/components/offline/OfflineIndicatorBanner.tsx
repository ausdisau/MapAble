"use client";

import { WifiOff } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type OfflineIndicatorBannerProps = {
  className?: string;
  /** Extra status text (e.g. cached venue count). */
  detail?: string;
};

/**
 * Persistent banner when connectivity is lost. Keeps previously cached
 * venue accessibility specs available without blocking navigation.
 */
export function OfflineIndicatorBanner({
  className,
  detail,
}: OfflineIndicatorBannerProps) {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-black">You are offline</p>
          <p className="mt-1 leading-6">
            Map tiles and live search may be unavailable. You can still review
            previously searched venue accessibility details stored on this
            device.
            {detail ? ` ${detail}` : ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
