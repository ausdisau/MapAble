# CSI Transport Intelligence

`@mapable/domain-transport` contains pure transport eligibility, route
feasibility and disruption-recovery proposal policy. Prisma-backed transport
services adapt verified records into this policy package; the package itself
does not import databases, maps, booking systems or notifications.

Mandatory accessibility evidence fails closed. Missing features, expired
credentials, stale route evidence and participant mismatches are exclusion
reasons, not lower-ranked options. Recovery policy creates a proposal or
requires human review; it never cancels or rebooks a trip.
