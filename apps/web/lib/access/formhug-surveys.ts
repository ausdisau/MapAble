/** External survey configuration. No response data is ingested by this module. */
export const FORMHUG_SURVEYS = {
  community: {
    title: "MapAble Community Accessibility Survey (pilot)",
    url: "https://formhug.ai/f/f50pAQ",
    embed: "https://formhug.ai/f/f50pAQ/embedded.js?inner_redirect=false&banner=show&height=2441",
  },
  trust: {
    title: "Trust in Disability Services and Inclusion Index (research draft)",
    url: "https://formhug.ai/f/BRXNVn",
    embed: "https://formhug.ai/f/BRXNVn/embedded.js?inner_redirect=false&banner=show&height=2441",
  },
} as const;

export type FormHugSurveyKind = keyof typeof FORMHUG_SURVEYS;

export function isTrustRecruitmentApproved(flag?: string): boolean {
  return flag === "true";
}
