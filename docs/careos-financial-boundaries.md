# CareOS financial boundaries

## Scope

Financial boundaries cover AbilityPay, invoicing, plan-manager views, marketplace fee disclosure, and any payment-adjacent intelligence.

## Permitted

- Explain invoice line items against delivered service evidence
- Surface reconciliation differences for **participant review**
- Summarise budget utilisation from authorised records
- Prepare questions for plan managers or financial delegates

## Prohibited

- Approving payments or releases without participant authority
- Auto-matching invoices to funding without evidence
- Inferring funding availability when expected cost is unknown
- Executing refunds, chargebacks, or plan amendments

## Authority

Financial domains (`finance`, `abilitypay`, `payments`) never inherit from delegate invitations. Explicit **ParticipantAuthorityGrant** with step-up where configured is required (`docs/careos/identity-and-authority.md`).

## Deterministic reconciliation

`lib/abilitypay/abilitypay-service.ts` returns `participant_review`, `needs_information`, or `matched` — never auto-settles discrepancies. Uncertainty is surfaced when expected cost context is missing.

## Audit

All financial intelligence outputs link to invoice IDs, evidence sources, and actor identity. No payment credentials in CareOS audit metadata (redaction per `docs/careos/AUDIT_AND_PRIVACY.md`).
