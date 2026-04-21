import { useQuery } from "@tanstack/react-query";
import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from "./types";

export function useWidgetConfig(): { config: WidgetConfig; isLoading: boolean } {
  const query = useQuery<WidgetConfig>({
    queryKey: ["/api/widget-config"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/widget-config", { credentials: "include" });
        if (!res.ok) throw new Error("config fetch failed");
        const data = (await res.json()) as Partial<WidgetConfig>;
        return {
          ...DEFAULT_WIDGET_CONFIG,
          ...data,
          featureFlags: { ...DEFAULT_WIDGET_CONFIG.featureFlags, ...(data.featureFlags || {}) },
          endpoints: { ...DEFAULT_WIDGET_CONFIG.endpoints, ...(data.endpoints || {}) },
        };
      } catch {
        return DEFAULT_WIDGET_CONFIG;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    config: query.data || DEFAULT_WIDGET_CONFIG,
    isLoading: query.isLoading,
  };
}
