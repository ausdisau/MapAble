"use client";

export function MetabaseDashboardEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <iframe
      src={embedUrl}
      title="Analytics dashboard"
      className="h-[600px] w-full rounded-lg border"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
