export function isN8nEnabled(): boolean {
  return process.env.N8N_ENABLED === "true";
}

export function getN8nConfig() {
  return {
    baseUrl: process.env.N8N_BASE_URL ?? "",
    apiKey: process.env.N8N_API_KEY ?? "",
    webhookSecret: process.env.N8N_WEBHOOK_SECRET ?? "",
  };
}
