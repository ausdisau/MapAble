import { ACCESS_DISCLAIMER } from "@/lib/access/map/copy";

export function AccessibilityDisclaimerPanel() {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      aria-label="Accessibility information disclaimer"
    >
      {ACCESS_DISCLAIMER}
    </aside>
  );
}
