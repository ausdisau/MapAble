# Native MapAble Companion foundation

Expo app: `apps/companion` — **not** a WebView wrapper.

## Flags

- `MAPABLE_COMPANION_ENABLED=false`
- `MAPABLE_COMPANION_VISIT_PACK_ENABLED=false`

Requires Communication Passport flag for Visit Pack compile.

## Security

- Visit Packs stored via encrypted store boundary (`expo-secure-store` in native)
- Device enrolment + revocation with remote sign-out signal
- Notification bodies redacted
- Stop AURA local control

## Accessibility

- 48dp touch targets
- Screen reader labels
- No compulsory camera / QR / smartphone for essential access
