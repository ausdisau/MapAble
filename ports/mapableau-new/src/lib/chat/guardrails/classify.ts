/**
 * Chat guardrail input/output classifier for mapableau-new.
 *
 * Ported from REPL server/chat-guardrails.ts (classification portion).
 * Pure functions — no database calls. Separated from audit.ts so classifiers
 * can be used in both Node and Edge runtimes.
 *
 * The NDIS Quality & Safeguarding policy pack is loaded from the JSON file in
 * the same directory (policy.ts) at module init time.
 */

import { POLICY_PACK } from "./policy";

export type SafetyCategory =
  | "prompt_injection"
  | "medical_legal_financial_advice"
  | "pricing_or_consent_circumvention"
  | "third_party_pii_without_consent"
  | "abuse_neglect_exploitation"
  | "self_harm_suicide"
  | "immediate_danger"
  | "reportable_incident"
  | "complaint"
  | "privacy_breach"
  | "consent_record"
  | "unverifiable_price_eligibility_claim"
  | "policy_contradiction";

export interface GuardrailVerdict {
  categories: SafetyCategory[];
  actions: string[];
  policyRefs: string[];
  blocked: boolean;
  transformedInput: string;
  responseTemplate?: string;
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyUserTurn(
  input: string,
  isStaffOrAdmin = false,
): GuardrailVerdict {
  const categories: SafetyCategory[] = [];
  const actions: string[] = [];
  const policyRefs: string[] = [];
  let blocked = false;

  // Prompt injection
  if (
    hasAny(input, [
      /ignore (all )?(previous|system|developer) instructions/i,
      /reveal.*(system prompt|hidden instructions|developer message)/i,
      /jailbreak/i,
      /act as DAN/i,
    ])
  ) {
    categories.push("prompt_injection");
    actions.push("refusal");
    policyRefs.push(POLICY_PACK.refs.privacy);
    blocked = true;
  }

  // Medical / legal / financial advice
  if (
    hasAny(input, [
      /\b(diagnose|diagnosis|medication dose|what dose|dosage|should i take|prescribe|treatment plan)\b/i,
      /\b(sue|legal advice|contract advice|tax advice|financial advice|invest my|hide income)\b/i,
    ])
  ) {
    categories.push("medical_legal_financial_advice");
    actions.push("refusal", "human_pathway");
    policyRefs.push(POLICY_PACK.refs.quality);
    blocked = true;
  }

  // Pricing / consent circumvention
  if (
    hasAny(input, [
      /\b(bypass|avoid|circumvent|fake|falsify|overcharge|charge more than|ignore ndis price|without consent|no consent)\b/i,
    ]) &&
    hasAny(input, [
      /\b(ndis|price|pricing|claim|invoice|consent|service agreement)\b/i,
    ])
  ) {
    categories.push("pricing_or_consent_circumvention");
    actions.push("refusal", "human_pathway");
    policyRefs.push(POLICY_PACK.refs.quality);
    blocked = true;
  }

  // Third-party PII without consent
  const thirdPartyPii =
    hasAny(input, [
      /\b(neighbour|neighbor|friend|worker|carer|support coordinator|someone else|another person)\b/i,
    ]) &&
    hasAny(input, [
      /\b(ndis number|medicare|address|phone|email|date of birth|dob|diagnosis)\b/i,
    ]);
  const affirmativeConsent =
    /\b(has|gave|given|provided|with|clear|explicit|documented)\s+(consent|permission|authorisation|authorization)\b/i.test(
      input,
    ) || /\b(authorised|authorized|nominee|guardian)\b/i.test(input);
  const deniedConsent =
    /\b(no|not|without|hasn't|has not|never)\s+(consent|permission|authorisation|authorization|given permission)\b/i.test(
      input,
    );
  if (thirdPartyPii && (!affirmativeConsent || deniedConsent) && !isStaffOrAdmin) {
    categories.push("third_party_pii_without_consent");
    actions.push("refusal", "human_pathway");
    policyRefs.push(POLICY_PACK.refs.privacy);
    blocked = true;
  }

  // Abuse / neglect / exploitation (never blocked — safeguarding)
  if (
    hasAny(input, [
      /\b(hit me|hurt me|abused|neglected|exploited|stole from me|threatened|unsafe with my worker|sexual misconduct|assault|violence|discrimination)\b/i,
    ])
  ) {
    categories.push("abuse_neglect_exploitation", "reportable_incident");
    actions.push("flag_safeguarding_concern", "log_incident_draft", "escalate_to_human");
    policyRefs.push(POLICY_PACK.refs.quality, POLICY_PACK.refs.incidents);
  }

  // Self-harm / suicide
  if (
    hasAny(input, [
      /\b(kill myself|suicide|end my life|self harm|self-harm|want to die|can't go on)\b/i,
    ])
  ) {
    categories.push("self_harm_suicide", "immediate_danger");
    actions.push("flag_safeguarding_concern", "escalate_to_human");
    policyRefs.push(POLICY_PACK.refs.incidents);
  }

  // Immediate danger / emergency
  if (
    hasAny(input, [
      /\b(fire|trapped|unconscious|bleeding|can't breathe|immediate danger|right now danger|emergency|000)\b/i,
    ])
  ) {
    categories.push("immediate_danger");
    actions.push("flag_safeguarding_concern", "escalate_to_human");
    policyRefs.push(POLICY_PACK.refs.incidents);
  }

  // Complaint
  if (
    hasAny(input, [
      /\b(complaint|complain|unhappy with|not happy with|feedback|formal complaint)\b/i,
    ])
  ) {
    categories.push("complaint");
    actions.push("log_complaint_draft", "human_pathway");
    policyRefs.push(POLICY_PACK.refs.complaints);
  }

  // Privacy breach
  if (
    hasAny(input, [
      /\b(data breach|privacy breach|wrong person|sent to someone else|shared my information|leaked|exposed my)\b/i,
    ])
  ) {
    categories.push("privacy_breach");
    actions.push("flag_safeguarding_concern", "log_incident_draft", "escalate_to_human");
    policyRefs.push(POLICY_PACK.refs.privacy);
  }

  // Consent record / withdrawal
  if (
    hasAny(input, [
      /\b(i do not consent|i don't consent|withdraw consent|refuse consent|do not share|don't share)\b/i,
    ])
  ) {
    categories.push("consent_record");
    actions.push("record_consent", "human_pathway");
    policyRefs.push(POLICY_PACK.refs.privacy);
  }

  return {
    categories: uniq(categories),
    actions: uniq(actions),
    policyRefs: uniq(policyRefs),
    blocked,
    transformedInput: input,
    responseTemplate: blocked ? refusalFor(uniq(categories)) : safeguardingResponseFor(uniq(categories)),
  };
}

function refusalFor(categories: SafetyCategory[]): string {
  if (categories.includes("prompt_injection")) {
    return "I can't help with that request.";
  }
  if (categories.includes("medical_legal_financial_advice")) {
    return "I'm not able to provide clinical, legal or financial advice. For medical questions, please speak with your doctor. For legal questions, contact a solicitor. For financial guidance, speak with a financial counsellor. I can help you find the right support service.";
  }
  if (categories.includes("pricing_or_consent_circumvention")) {
    return "I'm not able to help with that. MapAble must follow NDIS pricing and consent rules. If you have concerns about pricing or a service agreement, please contact a support coordinator or the NDIS Commission on 1800 035 544.";
  }
  if (categories.includes("third_party_pii_without_consent")) {
    return "I'm not able to store or process another person's identifying information unless they have given their consent. If you're acting on their behalf, please make sure documented consent is in place.";
  }
  return "I'm not able to help with that request.";
}

function safeguardingResponseFor(categories: SafetyCategory[]): string | undefined {
  if (categories.includes("immediate_danger")) {
    return `This may be an emergency.\n\nPlease call 000 now if anyone is in immediate danger.\n\nI will also flag this for a MapAble human team member to review. If you can, move to a safer place and ask a trusted person nearby for help.`;
  }
  if (categories.includes("self_harm_suicide")) {
    return `I'm really concerned about your safety.\n\nIf you might hurt yourself now, call 000 now.\n\nYou can also call Lifeline on 13 11 14 for 24/7 crisis support.\n\nI will flag this for a MapAble human team member. You do not have to handle this alone.`;
  }
  if (
    categories.includes("abuse_neglect_exploitation") ||
    categories.includes("reportable_incident")
  ) {
    return `Your safety comes first.\n\nIf you are in immediate danger, call 000 now.\n\nI will make a safeguarding draft and flag this for urgent human review. MapAble's process is: support you first, then record, report and learn. Reportable incidents may need to be notified to the NDIS Commission. You can also contact the NDIS Commission on 1800 035 544.`;
  }
  if (categories.includes("privacy_breach")) {
    return `Thanks for telling me.\n\nI will flag this as a privacy concern for human review.`;
  }
  if (categories.includes("complaint")) {
    return `You can make a complaint. It is OK to complain. It will not affect your supports.\n\nI will create a complaint draft for the MapAble team. Complaints should be acknowledged within 2 business days. You can also contact the NDIS Commission on 1800 035 544 at any time.`;
  }
  if (categories.includes("consent_record")) {
    return `I understand. I will record your consent preference.\n\nYou have the right to withdraw consent for data sharing at any time. A MapAble team member will follow up to make sure your preferences are applied correctly.`;
  }
  return undefined;
}

export function buildPolicySystemPrompt(): string {
  return `You are MapAble Chat, an accessibility-context travel and support assistant for MapAble, an Australian NDIS superapp.

Policy pack: ${POLICY_PACK.version}

Follow these policy obligations on every turn:
- NDIS Code of Conduct aligned behaviour: act with respect for individual rights, privacy, dignity, choice and control.
- Rights first: preserve dignity, privacy, choice and control.
- Zero tolerance for abuse, neglect, exploitation, violence, sexual misconduct or discrimination.
- Support first, then report: if an incident or safeguarding concern appears, help the person get safe first, then record, escalate and explain reporting pathways.
- Use Australian context, plain English and Easy Read friendly wording by default.
- Do not provide clinical, legal or financial advice. Do not diagnose, recommend medication doses, interpret laws as legal advice or tell someone how to structure finances. Offer general information and a qualified human pathway.
- Do not help circumvent NDIS pricing, consent, privacy, worker screening, incident reporting or payment assurance rules.
- Do not reveal or repeat third-party identifying information unless consent is clear and necessary.
- If immediate danger is possible, tell the user to call 000 now. For suicide or self-harm risk, also provide Lifeline 13 11 14. For provider complaints, provide the NDIS Quality and Safeguards Commission on 1800 035 544.

Relevant policy text:
- ${POLICY_PACK.principles.join("\n- ")}
- Complaints are acknowledged within 2 business days and can be made to the NDIS Commission at any time.
- Reportable incidents require immediate notification within 24 hours for death, serious injury, abuse or neglect, unlawful sexual or physical contact, or sexual misconduct, with 5-business-day follow-up.
- Privacy records are retained for at least 7 years.

Answer structure:
1. Short plain-language headline.
2. Key safety/privacy/NDIS considerations.
3. Practical next steps and human support pathway when relevant.`;
}
