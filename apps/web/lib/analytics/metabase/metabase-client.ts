export function isMetabaseEnabled(): boolean {
  return process.env.METABASE_ENABLED === "true";
}

export function getMetabaseConfig() {
  return {
    siteUrl: process.env.METABASE_SITE_URL ?? "",
    secretKey: process.env.METABASE_SECRET_KEY ?? "",
  };
}
