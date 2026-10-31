# MapAble Marketplace closed alpha — synthetic, test-only
Status: IMPLEMENTED SCAFFOLD / NOT RELEASED. Research only, no external transactions.

## Scope and data lineage
The product fixture uses the **WHO Priority Assistive Products List** as *classification inspiration* and public NDIS AT guidance to illustrate potential groups. No WHO/NDIS catalogue, individual prices, registration, medical-device approvals, or seller inventory is represented. Each listing is fictional and explicitly labelled. Do not copy commercial product descriptions or photos without permission.

Sources:
- https://www.who.int/publications/i/item/priority-assistive-products-list
- https://www.ndis.gov.au/participants/assistive-technology/assistive-technology-and-advisors/what-assistive-technology
- https://www.ndis.gov.au/providers/working-participants/assistive-technology-providers/how-prepare-evidence-participants-assistive-technology-assessment
- https://docs.stripe.com/payments/mobile/accept-payment
- https://docs.stripe.com/testing

## App
Existing apps/mobile Expo 57 / React Native 0.86 app gets a separate Marketplace tab showing eight example goods/services, function-based search, risk filters, and a local-only planning shortlist. The screen never collects sensitive data. Nothing is uploaded or sent to any seller. Every item is visibly synthetic and any specialist-review example cannot enter the planning price total.

## Stripe boundary
No account-specific Stripe actions were taken. **NO** publishable key, secret key, PaymentIntent, PaymentSheet, Connect onboarding, test customer, or payment route has been created or activated by this alpha. The pure alphaPaymentState() helper rejects live mode and absent/non-test client config. It is a state gate only, not a payment integration.

To implement optional test-mode payment *later*, first complete reviewed server-authoritative quote approval; resolve existing webhook replay/mode rejection flaws; use a Stripe sandbox/test account chosen explicitly by the operator, test-only publishable key in mobile, and a server-created PaymentIntent plus ephemeral customer keys if needed. Use Stripe's recommended PaymentSheet SDK and webhooks; never embed secret keys or trust prices sent by a client. Connected vendor payout must remain off until entity, commercial, registration, KYC, consumer law, privacy and PayCore reconciliation reviews pass.

## Closed alpha gates
- Access only to a small named internal cohort, protected by real sign-in + server allowlist. The current tab is guarded by a default-off mobile env flag and requires internal development builds; **do not treat a client env flag as security for real data**.
- Distinguish diagnosis-free functional preferences from medical advice or NDIS funding assessment.
- Manual assistive-tech validation with keyboard/external switch, TalkBack/VoiceOver, AAC, 200–400% reflow, large fonts, fatigue, speech control and low-connectivity.
- Supplier/provider/assessor identities remain synthetic; no delegated authority inferred from user role.
- Refund, complaints, product recalls, seller vetting, NDIS registration classification, Privacy Act and TGA scope require review before real commerce.
- No production deployment, no Stripe live/test payment execution, no automatic consumer charges.

## Run
Set EXPO_PUBLIC_MAPABLE_MARKETPLACE_ALPHA=true in a private development environment and run `cd apps/mobile && npm run start`. This **reveals a local synthetic UI only**, not an authenticated commercial service. It must not be used as the sole security gate in any deployed real-data alpha.

## Next
1. Verify Expo locked dependencies and compile in CI; test on real Android and iOS devices.
2. Introduce server-validated alpha allowlist, consent scopes and persistent non-sensitive study results.
3. Reconcile draft Marketplace PRs #4–#6 and PayCore #643 security blockers before enabling sandbox payments.
4. Invite and support a small access-diverse closed tester group with feedback and incident handling.
