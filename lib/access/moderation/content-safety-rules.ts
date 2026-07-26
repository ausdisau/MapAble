const PHONE_RE = /\b(\+?\d[\d\s-]{7,}\d)\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const MEDICAL_RE =
  /\b(diagnosis|autism|adhd|dementia|schizophrenia|bipolar|medical record)\b/i;
const LEGAL_CLAIM_RE =
  /\b(dda certified|fully compliant|ndis approved|guaranteed accessible)\b/i;
const ABUSE_RE = /\b(kill|idiot|stupid staff)\b/i;

export function scanReviewForModerationFlags(body: string): string[] {
  const flags: string[] = [];
  if (PHONE_RE.test(body)) flags.push("Contains phone number");
  if (EMAIL_RE.test(body)) flags.push("Contains email");
  if (MEDICAL_RE.test(body)) flags.push("Possible medical detail");
  if (LEGAL_CLAIM_RE.test(body)) flags.push("Legal compliance claim");
  if (ABUSE_RE.test(body)) flags.push("Possible abusive language");
  return flags;
}
