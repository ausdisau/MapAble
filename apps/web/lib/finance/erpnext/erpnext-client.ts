export function isErpnextEnabled(): boolean {
  return process.env.ERPNEXT_ENABLED === "true";
}

export function getErpnextConfig() {
  return {
    baseUrl: process.env.ERPNEXT_BASE_URL ?? "",
    apiKey: process.env.ERPNEXT_API_KEY ?? "",
    apiSecret: process.env.ERPNEXT_API_SECRET ?? "",
  };
}
