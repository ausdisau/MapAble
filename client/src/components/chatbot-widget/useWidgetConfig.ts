import { useQuery } from "@tanstack/react-query";
import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from "./types";

// Build-time kill switch: set VITE_CHATBOT_WIDGET_DISABLED=true to fully disable
// the widget regardless of backend config. Useful for incident response.
const KILL_SWITCH = import.meta.env.VITE_CHATBOT_WIDGET_DISABLED === "true";

function applyKillSwitch(config: WidgetConfig): WidgetConfig {
  if (!KILL_SWITCH) return config;
  return { ...config, enabled: false };
}

export function useWidgetConfig(): { config: WidgetConfig; isLoading: boolean } {
  const query = useQuery<WidgetConfig>({
    queryKey: ["/api/widget-config"],
    enabled: !KILL_SWITCH,
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
    config: applyKillSwitch(query.data || DEFAULT_WIDGET_CONFIG),
    isLoading: query.isLoading,
  };
}
