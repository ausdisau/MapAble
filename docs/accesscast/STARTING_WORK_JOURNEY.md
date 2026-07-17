# Starting Work Journey AccessCast

Synthetic journey: **Home → Harbour Civic Centre, Room 3.12** (Taylor fixture).

## Scenario inputs

- Support worker confirmed
- Accessible vehicle requested but not confirmed (SPOF)
- Destination lift evidence stale / unknown
- Northern entrance construction from 08:00
- Return accessible transport unconfirmed

## Expected outlook

`fragile`, `cannot_confirm`, or `stale` — never `stable`.

Return-journey fragility is never hidden by outward success.

## API

`POST /api/accesscast/journeys/outlook`  
Requires `MAPABLE_ACCESSCAST_ENABLED` and `MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED`.

## Timeline (authoritative list)

| Time | Event |
| --- | --- |
| 07:30 | Accessible vehicle confirmation due |
| 08:00 | Construction near northern entrance |
| 08:15 | Recommended departure buffer |
| 08:30 | Journey start |
| 09:10 | Expected arrival |
| 09:30 | Workplace induction |
| 12:00 | Return-transport confirmation due |
