# MapAble Access Ontology

**Status:** canonical taxonomy contracts (v2)  
**Public claim:** none — ontology seed, not a certification scheme  
**Code:** `lib/access/intelligence-next/ontology/` · `lib/access/infrastructure/`

## Purpose

A shared vocabulary so MapAble (and eventually partner systems) can reason about:

1. what a person **requires** (Access Passport / `AccessRequirement`);
2. what an entity **provides** (`AccessCapability`);
3. whether a journey is **compatible** in context.

## Twenty canonical access domains

These are functional domains. They are **not** impairment categories and must not be used as “people with X disability need Y.”

| Domain id | Label | Example concepts |
| --- | --- | --- |
| `mobility_movement` | Mobility & movement | step-free, gradient, kerb ramp, path width, surface, turning space, lift, stairs, handrail, walking distance |
| `reach_strength_dexterity` | Reach, strength & dexterity | reach height, low-force door, usable handle, payment terminal, controls |
| `seating_stamina` | Seating & stamina | seating availability, rest interval, queue length, shade/shelter |
| `vision` | Vision | contrast, glare, lighting, large print, Braille, tactile, detectable edges, screen reader |
| `hearing` | Hearing | captions, hearing augmentation, visual announcements, acoustics |
| `speech_communication` | Speech & communication | AAC, text communication, response time, direct communication |
| `auslan_language` | Auslan & language | Auslan, interpreters, Easy Read, community languages |
| `cognition_learning` | Cognition & learning | plain language, step-by-step, predictable layout, simple wayfinding |
| `executive_memory` | Executive function & memory | reminders, sequencing, reduced cognitive load, confirmations |
| `sensory_regulation` | Sensory regulation | noise, crowding, lighting, smell, temperature, quiet space, sensory-friendly times |
| `psychosocial` | Psychosocial access | predictability, queue alternatives, chosen supporter, respectful service |
| `pain_fatigue_fluctuating` | Pain, fatigue & fluctuating capacity | rest opportunities, shorter routes, flexible timing, reduced waiting |
| `self_care_continence` | Self-care & continence | accessible toilet, ambulant toilet, Changing Places, transfer space |
| `equipment_at` | Equipment & assistive technology | wheelchair dimensions, hoist, charging, communication devices |
| `assistance_animals` | Assistance animals | entry policy, waiting areas, water, space |
| `digital` | Digital access | keyboard, switch, voice, screen reader, zoom/reflow, accessible auth |
| `service_staff` | Service & staff access | disability-aware staff, adjustment procedures, assistance on request |
| `financial_admin` | Financial/administrative access | understandable prices, accessible forms, alternative channels, complaints |
| `transport` | Transport access | boarding, vehicle type, restraint, transfer, companion, pickup/drop-off |
| `emergency` | Emergency access | multi-modal alarms, accessible exits, evacuation information |

## Concept identity

Concept ids are stable strings:

```text
{domain}.{attribute}
```

Examples: `mobility_movement.step_free`, `hearing.hearing_augmentation`, `transport.accessible_vehicle`.

### Legacy v1 ids

Ontology v1 used coarser domains (`physical`, `sensory`, `cognitive_communication`, `service`, `digital`, `transport`). Those concept ids remain valid forever as aliases (e.g. `physical.step_free` → `mobility_movement.step_free`). Lookup resolves either id.

## Concept schema

Each `AccessOntologyConcept` declares:

| Field | Purpose |
| --- | --- |
| `id` | Stable concept id |
| `domain` | One of the twenty `AccessDomain` values |
| `dataType` | `boolean` \| `number` \| `enum` \| `text` \| `dimension` \| `duration` |
| `unit` | e.g. `mm`, `m`, `ratio`, or null |
| `evidenceRequirements` | What evidence is needed to assert a capability |
| `personalFitBehaviour` | How the concept participates in matching |
| `standardsMappings` | Optional pointers (AS1428, WCAG, DSAPT…) — not automatic compliance |
| `permittedInference` / `prohibitedInference` | Guardrails for compilers and AI |
| `defaultFreshnessDays` | Staleness policy seed |
| `reviewOwner` | Domain team responsible for ontology changes |

## Prohibited concepts

The ontology must never define:

- a universal accessibility score;
- diagnosis → requirement inference;
- “accessible / not accessible” as a single place attribute used for consequential decisions.

## Versioning

| Version | Location | Notes |
| --- | --- | --- |
| `1.0.0` | `seed-v1.ts` | Frozen coarse domains; still resolved |
| `2.0.0` | `seed-v2.ts` | Twenty domains + expanded concept set + v1 aliases |

`ACCESS_ONTOLOGY_CURRENT` points at v2. Deprecations require `deprecationPathway` and Access Infrastructure Council review (see [GOVERNANCE.md](./GOVERNANCE.md)).
