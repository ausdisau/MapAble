/**
 * My Support is a bounded participant-facing preview.
 *
 * A server-side flag is deliberately required before authenticated
 * participant data is read or the route is shown on the web.
 * Do not use an EXPO_PUBLIC or NEXT_PUBLIC switch for this gate.
 */
export function isMySupportPreviewEnabled(): boolean {
  return process.env.MAPABLE_MY_SUPPORT_PREVIEW_ENABLED === "true";
}
