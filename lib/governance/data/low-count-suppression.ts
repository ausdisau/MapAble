import { phase5Config } from "@/lib/config/phase5";

export function suppressLowCount(value: number): {
  suppressed: boolean;
  value: number | null;
} {
  const threshold = phase5Config.smallCellSuppressionThreshold;
  if (value > 0 && value < threshold) {
    return { suppressed: true, value: null };
  }
  return { suppressed: false, value };
}
