# Co-Design Protocol — HITL AI for Disability Services

**Status:** Required precursor gate. No participant-facing Human-in-the-Loop (HITL) AI feature in MapAble's Concepts **B** (Participant Preference Articulator), **C** (NDIS-aware Transport Orchestrator) or **E** (I-CAN Translator and HITL Appeal Layer) — see `research/hitl-ai-disability-services-au.md` — may move from spec into build until **stages S0 and S1 of §1.3 have been signed off by the relevant DRO partners and recorded in the engagement record (§1.4)**. Subsequent stages (S2–S6) gate further progression: build → S2 sign-off; coordinator pilot → S3 sign-off; participant pilot → S4 joint go; general release → S5 published statement.

**Owner:** Head of Product (accountable) + Co-Design Lead (responsible).
**Review cadence:** Every 6 months, or whenever any partner organisation issues new guidance, whichever is sooner.
**Aligned policies:** NDIS Quality and Safeguards Commission AI Transparency Statement; DTA *Policy for the responsible use of AI in government* v2.0; NDIS Code of Conduct; Disability Discrimination Act 1992 (Cth).

This document has four parts:

1. [Engagement Charter](#1-engagement-charter)
2. [Consent and Transparency Template](#2-consent--transparency-template)
3. [Harms Escalation Path](#3-harms-escalation-path)
4. [Accessible-Formats Specification](#4-accessible-formats-specification)

---

## 1. Engagement Charter

### 1.1 Partner organisations

The four Disability Representative Organisations (DROs) below are first-call co-design partners. Engagement is **non-tokenistic, paid, and time-bounded**.

| Partner | Cohort focus | Required for |
|---|---|---|
| **People with Disability Australia (PWDA)** | Cross-disability peak; rights-based framing | All three concepts (B, C, E) |
| **Australian Federation of Disability Organisations (AFDO)** | Federation of national DROs; intersectional reach | All three concepts |
| **First Peoples Disability Network (FPDN)** | First Nations participants; cultural safety | **Mandatory** for any concept tested with First Nations participants; mandatory for E |
| **Inclusion Australia** | People with intellectual disability; Easy Read authority | **Mandatory** for E (I-CAN translator); strongly recommended for B |

Secondary partners to be consulted as scope dictates: Children and Young People with Disability Australia (CYDA), National Ethnic Disability Alliance (NEDA), Deaf Australia, Blind Citizens Australia, Physical Disability Australia, Down Syndrome Australia, Autism Aspergers Advocacy Australia (A4).

### 1.2 Co-design principles

1. **"Nothing about us without us."** No design artefact, prompt, model output template, or escalation copy ships without sign-off from at least two partner organisations relevant to the cohort.
2. **Paid time, paid expertise.** All DRO time is invoiced at the partner's published advisory rate; participant lived-experience contributors are paid at no less than the **PWDA Lived Experience Renumeration Guidelines** rate.
3. **HITL is non-negotiable.** Every Concept B/C/E feature has a named accountable human in the loop *before* any output is delivered to a participant. AI is positioned as a drafting assistant; the accountable human retains decision authority and is named in the audit log.
4. **Coordinator-first, then participant.** Per the research finding, no concept is tested directly with participants until at least three coordinators have completed two full cycles with the feature *and* the relevant DRO has approved participant-facing rollout.
5. **Cohort oversampling.** Each prototype cohort deliberately oversamples for at least one group flagged as high-risk for algorithmic harm: complex communication needs, psychosocial disability, intellectual disability, or First Nations participants.
6. **Data sovereignty.** First Nations data is governed by the **CARE principles** (Collective benefit, Authority to control, Responsibility, Ethics) in addition to FAIR. FPDN must approve any storage, transit, or analytic use of First Nations participant data.
7. **Right to walk away.** Any partner may end the engagement at any time; their feedback to date is retained but not represented as endorsement.
8. **No surveillance creep.** Telemetry collected for safety/quality reasons is enumerated in the consent template; no other telemetry is added without re-consent and DRO review.

### 1.3 Engagement stages (per concept)

| Stage | Output | DRO sign-off required | Gate |
|---|---|---|---|
| **S0 — Brief** | Plain-language one-pager describing the proposed feature, the harm it might cause, and the cohort | Acknowledgement only | Cannot proceed to S1 without acknowledgement |
| **S1 — Discovery** | Two paid workshops per partner; produce *risks register* and *value statement* | Sign-off on risks register | Cannot proceed to S2 without sign-off |
| **S2 — Co-design** | Prompt templates, output templates, error/uncertainty copy, refusal copy, escalation copy | Sign-off on each artefact | Cannot proceed to S3 without sign-off |
| **S3 — Coordinator pilot** | Five coordinators, two full cycles each, no participant exposure | DRO observes ≥1 cycle; written go/no-go | Cannot proceed to S4 without go |
| **S4 — Participant pilot** | Small participant cohort with explicit cohort oversampling | Joint go/no-go with DRO partner(s) | Cannot proceed to S5 without joint go |
| **S5 — General release** | Production rollout | DRO published statement (endorse, neutral, or object) recorded in `replit.md` | Release blocked until statement received |
| **S6 — Continuous review** | Quarterly harms review with DRO partners | Standing meeting | Concept paused if review skipped two quarters |

### 1.4 Engagement record

Every engagement (workshop, sign-off, observation, statement) is recorded as a row in `co_design_engagements` (table to be added when the first concept enters S1) with: concept, stage, partner organisation, participant attendees (de-identified count + cohort), date, paid amount, artefacts reviewed, sign-off status, accountable human. Records are retained for the lifetime of the feature plus 7 years per NDIS record-keeping rules.

---

## 2. Consent & Transparency Template

This template is the **minimum** AI transparency statement that must be presented to a participant (or coordinator acting for a participant) **before** any AI-generated content is shown to them. It is modelled on the NDIS Quality and Safeguards Commission AI Transparency Statement and the Australian Government DTA *Policy for the responsible use of AI in government v2.0* (Transparency, Accountability, and Human Oversight pillars).

### 2.1 Disclosure (always-on banner copy)

> **AI helped draft this.** A computer wrote the first version of what you are reading. A real person from MapAble has checked it before showing it to you. Their name is **{{accountable_human_name}}** and you can talk to them by **{{contact_method}}**.
>
> The AI sometimes makes mistakes. If something looks wrong, please tell us — we will fix it.

### 2.2 Consent items (presented at first use, then annually)

The participant (or substitute decision-maker, where one is in place under their plan) must be given the choice to accept or decline each of the following separately. Default for every item is **off**.

| # | Consent item | Plain-language wording |
|---|---|---|
| C1 | Use AI to **draft** content shown to me | "MapAble can use AI to write a first version of messages, summaries and forms for me. A real person checks it before I see it." |
| C2 | Use AI to **summarise** my plan, notes or messages | "MapAble can use AI to make short versions of long documents about me." |
| C3 | Use AI to **translate** between formats (e.g. Easy Read, AAC, Auslan, my language) | "MapAble can use AI to put information into the format that works best for me." |
| C4 | Use AI to **suggest** workers, transport, or supports | "MapAble can use AI to suggest workers, trips or supports. I always make the final choice." |
| C5 | Keep my AI conversations for **safety review** | "MapAble keeps the AI's drafts and the human's edits so we can find mistakes and fix them. They are kept private." |
| C6 | Allow MapAble to share **de-identified** patterns with our DRO partners for safety review | "MapAble can share patterns about how the AI is working — without your name — with disability organisations that help check on it." |

### 2.3 Withdrawal

Consent is granular and revocable at any time without affecting access to the underlying service. Withdrawing C1–C4 means the AI features stop; the human supports do not. Withdrawing C5 means audit data is purged within 30 days unless retention is required by law.

### 2.4 Required record

For every AI-assisted output shown to a participant, the system records:

- The accountable human's user ID and name (Concept B/C/E never silently auto-decides).
- The model and version used.
- The consent items in force at the moment of generation.
- The hash of the prompt and the unredacted output stored in the audit log.
- Whether the human edited the output before delivery (and the diff, if so).
- The participant's preferred format at delivery time (see §4).

This record is exposed to the participant on request via a Subject Access export within 30 days, per Privacy Act Australian Privacy Principle 12.

### 2.5 Refusal copy

If the AI is uncertain (low confidence, missing context, conflicting policy) the system **must refuse rather than guess**. Default copy:

> "I can't draft this confidently. I've passed it to **{{accountable_human_name}}** to write themselves. They will get back to you by **{{eta}}**."

---

## 3. Harms Escalation Path

This path applies when an AI-assisted output causes — or is reasonably likely to have caused — a harm to a participant, worker, or third party. "Harm" includes: incorrect plan information, discriminatory output, exposure of personal information, denial of a support, transport mis-routing creating a safety risk, or distress caused by tone/format.

### 3.1 Severity tiers

| Tier | Definition | First response SLA | Escalates to |
|---|---|---|---|
| **T1 — Catastrophic** | Risk of life, criminal exposure, mass data breach, child safety | Immediate (≤ 15 min) | CEO + NDIS Commission + OAIC + relevant police if applicable |
| **T2 — Serious** | Material financial harm, denial of care, discrimination, single-participant data breach | ≤ 4 business hours | Head of Product + DRO partner for that cohort |
| **T3 — Moderate** | Incorrect output reaching the participant, format failure, distress without injury | ≤ 1 business day | Co-Design Lead + accountable human |
| **T4 — Near miss** | Caught by HITL before reaching the participant | ≤ 5 business days (batched) | Co-Design Lead (weekly review) |

### 3.2 Reporting channels

A participant, supporter, worker, or DRO partner can raise a concern through any of the following — all routed to the same incident queue:

1. **In-app:** "Something went wrong" button visible on every AI-assisted screen. One tap; no form required.
2. **Email:** `safeguarding@mapable.example` (monitored ≥ 12 hours/day, with after-hours pager).
3. **Phone / SMS:** the safeguarding line number stored in the participant's profile contact card; supports National Relay Service and Auslan video relay.
4. **Through any DRO partner:** PWDA, AFDO, FPDN, Inclusion Australia each have a named MapAble liaison and a direct intake line.
5. **External regulators:** the in-app help screen always shows links to the **NDIS Quality and Safeguards Commission** complaints line (1800 035 544), the **OAIC** for privacy, and the **AHRC** for discrimination — without requiring the participant to exhaust internal channels first.

### 3.3 Response steps

For every report, regardless of tier:

1. **Acknowledge** to the reporter within the SLA above, in their preferred format (§4).
2. **Pause** the offending feature for the affected participant within 1 hour; pause it for the cohort within 24 hours if a pattern is suspected.
3. **Preserve** the audit record (model, prompt, output, edits, consent state at generation time).
4. **Triage** to the responsible accountable human; reassign if conflict of interest.
5. **Investigate** with the DRO partner for the affected cohort included by default; their participation is paid.
6. **Remediate** — correct the immediate harm (re-do the output, restore the support, refund, etc.); the participant chooses how they want this communicated.
7. **Report** to the participant in their preferred format (§4) within the SLA; report to the relevant external regulator within statutory timeframes (NDIS Commission notifiable incidents within 24 hours where applicable; OAIC notifiable data breaches within 30 days).
8. **Learn** — every incident updates the risks register (§1.3 S1) and, for T1/T2, triggers a mandatory review of whether the concept should remain in production.
9. **Disclose** — quarterly anonymised harms report shared with all DRO partners and published on the public site.

### 3.4 Whistleblower protection

Workers and contractors raising concerns about an AI feature are protected under MapAble's whistleblower policy; retaliation is itself a T2 incident.

---

## 4. Accessible-Formats Specification

Every participant-facing output produced by Concepts B, C, E (and any later participant-facing AI feature) must be available in **at least the participant's stated preferred format**, with the four formats below as the minimum supported set.

### 4.1 Format requirements

#### 4.1.1 Easy Read

- **Authority:** Inclusion Australia *Easy Read* style guide; CID *Easy English* guide; PWDA Easy Read examples.
- **Reading age target:** Grade 3–4 (Hemingway grade ≤ 4, Flesch-Kincaid grade ≤ 4).
- **Sentence rules:** one idea per sentence; ≤ 15 words per sentence; active voice; no metaphor; no idiom; no jargon (acronyms expanded on first use and on every page).
- **Layout:** ≥ 16 pt body text; ≥ 1.5 line spacing; sans-serif (Arial, Open Sans, or Atkinson Hyperlegible); left-aligned; no justified text; no italics; **bold** only for emphasis on a key word.
- **Imagery:** every key idea paired with a clear illustration or photo (CHANGE Picture Bank or Photosymbols where licensed); illustrations placed to the left of the text they describe; no decorative-only images.
- **Numbers:** spell out one to nine; numerals for 10+; prices written as `$120` not `one hundred and twenty dollars`; dates written as `Monday 5 May` not `05/05`.
- **Production:** AI may **draft** Easy Read; it must be **reviewed by a person with intellectual disability** before participant delivery, paid at the Inclusion Australia rate. The reviewer's user ID is recorded in the audit log alongside the accountable human.

#### 4.1.2 Augmentative and Alternative Communication (AAC)

- **Authority:** AGOSCI; Speech Pathology Australia AAC position statement.
- **Symbol sets supported:** PCS (Boardmaker), SymbolStix, Widgit, ARASAAC. The participant's existing AAC system is captured in their profile and all outputs use that symbol set — *we do not impose ours.*
- **Output modes:** symbol grid (PNG or JSON for compatible AAC apps), spoken audio (see §4.1.5 voice rules), and printable communication board.
- **Vocabulary:** core vocabulary first (pronouns, verbs, descriptors), fringe vocabulary as labels; Fitzgerald-Key colour coding by default unless the participant's system uses another scheme.
- **Latency:** AAC responses must be available within 2 seconds for synchronous interactions (e.g. transport confirmations); async outputs (plan summaries) within the human-review SLA.
- **Co-design:** AAC outputs are reviewed by an AAC user co-designer (paid) before any cohort rollout. AGOSCI is consulted for symbol set licensing and clinical accuracy.

#### 4.1.3 Auslan

- **Authority:** Deaf Australia; National Auslan Interpreter Booking and Payment Service (NABS) standards.
- **Default mode:** **human Auslan interpreter video**, not AI signing avatars. AI-generated signing is **not used for participant-facing output** until and unless Deaf Australia issues guidance permitting it; this is an explicit gate, not an internal decision.
- **Interpreter sourcing:** NAATI-certified interpreters via NABS or an equivalent panel; interpreter named in the audit log; participants may request a specific interpreter.
- **Caption parity:** all Auslan video outputs are accompanied by Plain-English captions (≥ 36 pt; high contrast; speaker identification when more than one signer is present).
- **Live interactions:** for synchronous coordinator–participant calls, MapAble books the interpreter; cost is on MapAble, not on the participant's plan.

#### 4.1.4 Key community languages

- **Initial set:** Mandarin, Arabic, Vietnamese, Cantonese, Greek, Italian, Punjabi, Spanish, Tagalog, Hindi (top community languages from ABS 2021 census of Australians who speak a language other than English at home), plus **the top three Aboriginal and Torres Strait Islander languages spoken in MapAble's service regions** (determined per region with FPDN; e.g. Yumplatok / Torres Strait Creole, Kriol, Pitjantjatjara, Warlpiri, Yolŋu Matha) — never Latin-only transliteration where the language has its own orthography.
- **Translation pipeline:** AI may **draft** translations for languages with strong AU-localised models. **Human NAATI-certified translator review is mandatory** before participant delivery for: legal/financial/medical content, plan summaries, consent text, and any T1/T2 incident communication.
- **First Nations languages:** AI translation is **off by default** and only enabled per-language with FPDN sign-off and a community-language-worker review pipeline. Where no certified translator exists, the system uses Plain English with a human cultural liaison rather than risk an unreviewed AI translation.
- **Right-to-left languages:** full RTL layout support (Arabic, Urdu, Hebrew); not flipped or mirrored Latin layout.
- **Names and pronouns:** the participant's name and pronouns are never translated or transliterated unless the participant has explicitly stored a transliteration in their profile.

#### 4.1.5 Voice and audio (cross-cutting)

- **TTS engines:** offer at least one neural Australian-English voice + the participant's preferred language voice. Avoid US-default voices for AU content.
- **Speed:** participant-controlled; default 0.9× standard rate; range 0.5×–1.5×.
- **Tone:** calm, neutral, no sales tone, no false urgency, no false empathy; the system never claims to "feel" anything.
- **Self-disclosure:** the voice opens with "This is the MapAble app speaking" on first interaction of each session and on demand thereafter.

### 4.2 Format-preference data model (specification, not implemented)

A future `participant_format_preferences` table should hold (per participant):

- preferred primary format (Easy Read | AAC | Auslan | language | Plain English)
- preferred AAC symbol set (PCS | SymbolStix | Widgit | ARASAAC | other)
- preferred language (BCP-47 tag)
- preferred TTS voice
- whether AI translation is permitted for that participant's language (default off for First Nations languages)
- last reviewed date (must be ≤ 12 months old, otherwise UI prompts re-confirmation)
- accountable human who last confirmed it

This table is the source of truth queried by every Concept B/C/E delivery point; an AI feature that cannot honour the preference must refuse and escalate per §3 rather than fall back to Plain English without consent.

### 4.3 WCAG and broader accessibility

All participant-facing surfaces continue to meet **WCAG 2.2 AA** as a baseline; the format-specific rules above are *additional* to, not replacements for, WCAG. Conformance is independently audited annually; the audit report is shared with DRO partners.

---

## 5. Enforceable build gate (PR checklist)

Any pull request that adds, enables, or expands a participant-facing surface for Concepts B, C or E **must** paste the checklist below into the PR description and tick every applicable item. PRs without this checklist — or with unticked items — must not be merged.

```markdown
### Co-Design Gate (docs/co-design-protocol.md)
Concept: [ ] B  [ ] C  [ ] E    Stage entered by this PR: [ S0 / S1 / S2 / S3 / S4 / S5 ]

- [ ] S0 brief acknowledged by: PWDA / AFDO / FPDN / Inclusion Australia (tick all that apply; FPDN required if First Nations cohort; Inclusion Australia required for E)
- [ ] S1 risks register signed off by the partners ticked above (link to engagement record row: #_____)
- [ ] S2 prompt / output / refusal / escalation copy signed off (link: #_____) — required if this PR ships any participant-facing copy
- [ ] S3 coordinator-pilot go received (link: #_____) — required before any participant flag is enabled
- [ ] S4 joint participant-pilot go received (link: #_____) — required for participant rollout
- [ ] S5 DRO published statement on file (link: #_____) — required for general release
- [ ] Consent items C1–C6 (§2.2) wired into this surface or N/A (explain): _____
- [ ] Accessible-formats (§4) honoured for the cohorts in scope; participant_format_preferences read before delivery
- [ ] "Something went wrong" reporting channel (§3.2) is reachable from every new screen this PR adds
- [ ] Audit record (§2.4) captures model, version, prompt hash, output, edits, consent state, accountable human
```

Until the engagement-record table (§1.4) and a feature-flag gate that reads from it exist (proposed as a follow-up task), this checklist is enforced by code review. Once the table exists, the feature-flag gate enforces it automatically and this checklist becomes the human cross-check.

## 6. Sign-off and version history

| Version | Date | Change | Approver |
|---|---|---|---|
| 0.1 | (this commit) | Initial protocol; all four parts | Drafted by Product; awaits DRO acknowledgement before any Concept B/C/E enters S1 |

This protocol itself follows its own rules: it will be re-issued in Easy Read for participant-facing publication once the Inclusion Australia review pipeline is in place.
