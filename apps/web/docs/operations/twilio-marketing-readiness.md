# Twilio marketing readiness

MapAble does not currently send promotional campaigns. This document defines the
minimum infrastructure and compliance readiness required before any marketing or
bulk engagement messaging is implemented.

## Required decisions before build

1. What is being promoted?
   - pilot participation;
   - provider onboarding;
   - event reminders;
   - participant re-engagement;
   - marketplace or service offers.
2. Which channel is approved?
   - SMS/MMS;
   - RCS;
   - WhatsApp;
   - email;
   - multi-channel.
3. What geography is in scope?
   - Australia-only;
   - United States;
   - global.
4. What consent records exist?
   - opt-in timestamp;
   - channel;
   - source/method;
   - opt-out status;
   - proof of consent.
5. What is the audience size and send frequency?
6. What conversion or safety metric will be tracked?

## Channel notes

### SMS/MMS

- Use a Twilio Messaging Service rather than raw sender numbers.
- Track delivery with status callbacks.
- Implement exponential backoff with jitter for rate limits.
- US sends require A2P 10DLC or toll-free verification before production.

### RCS

- Requires branded sender setup and approval.
- Use native SMS fallback for recipients without RCS support.
- Best for rich branded experiences, not urgent compliance notices.

### WhatsApp

- Requires opt-in and approved outbound templates.
- Free-form replies are limited to the 24-hour customer service window.
- Monitor quality score and block/report rates.

### Email

- Use transactional email only for account/service workflows unless marketing
  consent is explicitly recorded.
- Marketing email requires unsubscribe handling and sender identity details.

## Required infrastructure

- Consent table or service that records channel-specific opt-in and opt-out.
- Audience selection that excludes opted-out users.
- Message template registry with approval status.
- Status callback endpoint for delivery outcomes.
- Retry queue with rate-limit backoff and dead-letter handling.
- Suppression list for unsubscribed, invalid or bounced destinations.
- Audit logs for campaign creation, audience export and send approval.

## Human approval gates

Marketing sends must require human approval before dispatch:

- campaign content;
- audience definition;
- compliance readiness;
- send schedule;
- budget/rate-limit plan.

## Do not build yet

Do not implement a promotional send API until these are confirmed:

- channel;
- geography;
- audience size;
- consent source;
- sender type;
- status callback URL;
- opt-out wording;
- owner for compliance review.

## Initial safe implementation path

When approved, start with a non-sending campaign planner:

1. campaign draft;
2. consent/audience validation report;
3. template approval status;
4. dry-run recipient count;
5. human approval;
6. send job creation.

Only the last step should call Twilio APIs.
