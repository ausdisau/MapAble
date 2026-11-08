# MapAble Marketplace closed alpha (native component)

Source: legacy `ausdisau/mapableau-new` draft PR #644 (stacks on #641 and #642). Integrated into canonical `ausdisau/MapAble`.

`MarketplaceAlphaScreen.tsx` is a React Native/Expo component, intentionally **not mounted** in `apps/mobile/App.tsx` or the public navigation stack.

- The local catalogue is synthetic and imported from the portable, dependency-free `apps/web/packages/marketplace-inclusive/src/alpha-catalogue.ts` module.
- No Stripe, external API, invoice, payment, contact, order, actual role delegation or stock update.
- Real platform identity exists in the mobile app but **does not** provide a Marketplace alpha scope.
- Before mounting, enforce a server-authorised tester allowlist and a dedicated mobile scope, validate the Metro dependency boundary, secure token renewal/revocation, and pass TalkBack/VoiceOver, AAC/switch and 200–400% zoom testing.
- Do not enable the old transactional `MAPABLE_MARKETPLACE_ENABLED` flag to surface this component.
