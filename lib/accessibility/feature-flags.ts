/**
 * First-party MapAble Accessibility Panel vs third-party AccessiBe overlay.
 *
 * Default: OFF (AccessiBe remains until an explicit cut-over decision).
 * Preview/CI may set NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true.
 * Production cut-over requires account-owner approval — see
 * docs/remediation/ACCESSIBILITY_WIDGET_DECISION.md.
 */
export function isFirstPartyAccessibilityPanelEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL === "true";
}
