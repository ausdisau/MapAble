/**
 * Documented load scenarios — lightweight threshold checks (no live load test).
 */

export interface LoadScenario {
  id: string;
  name: string;
  target: string;
  p95MsThreshold: number;
  rpsTarget: number;
}

export const LOAD_SCENARIOS: LoadScenario[] = [
  {
    id: "api_read_baseline",
    name: "API read baseline",
    target: "GET /api/v1/organisations",
    p95MsThreshold: 500,
    rpsTarget: 50,
  },
  {
    id: "health_check_burst",
    name: "Health check burst",
    target: "Admin health dashboard",
    p95MsThreshold: 200,
    rpsTarget: 20,
  },
  {
    id: "federation_lookup",
    name: "Federation trust list",
    target: "listFederationTrusts",
    p95MsThreshold: 300,
    rpsTarget: 10,
  },
];

export function validateScenarioThreshold(scenario: LoadScenario, observedP95Ms: number): boolean {
  return observedP95Ms <= scenario.p95MsThreshold;
}
