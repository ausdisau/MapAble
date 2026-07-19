/**
 * Feature flags for the AI-Enabled Case Management module.
 *
 * - `enabled` gates the module entirely. When false the API returns 404 and
 *   the dashboard renders a disabled-state page.
 * - `aiEnabled` controls whether the AI insight endpoints will run. The
 *   default engine is rule-based and offline; turning this off is useful
 *   if regulators require all AI off in a deployment.
 * - `aiAutoRunOnCreate` makes case creation trigger a baseline summary
 *   insight. The engine remains advisory; humans must acknowledge insights
 *   before they influence escalation.
 */
export const caseManagementConfig = {
  enabled: process.env.CASE_MANAGEMENT_ENABLED === "true",
  aiEnabled: process.env.CASE_MANAGEMENT_AI_ENABLED === "true",
  aiAutoRunOnCreate: process.env.CASE_MANAGEMENT_AI_AUTORUN === "true",
  /**
   * Engine identifier embedded into AIInsight rows. When a real LLM
   * backend is plugged in via lib/cases/ai/engine.ts this string should
   * change so audit trails remain unambiguous about which engine produced
   * a given insight.
   */
  engineId: process.env.CASE_MANAGEMENT_AI_ENGINE_ID ?? "rules-v1",
} as const;

export type CaseManagementConfig = typeof caseManagementConfig;
