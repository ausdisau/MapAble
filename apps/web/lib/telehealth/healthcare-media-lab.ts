const loopbackHost = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/;
export const labRoomCode = /^[0-9a-f]{32}$/;

export function isHealthcareMediaLabEnabled(host: string | null) {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.MAPABLE_HEALTHCARE_PREVIEW_ENABLED === "true" &&
    process.env.MAPABLE_HEALTHCARE_MEDIA_LAB_ENABLED === "true" &&
    host !== null &&
    loopbackHost.test(host)
  );
}

export function isHealthcareMediaLabRequest(headers: Headers) {
  const host = headers.get("host");
  const origin = headers.get("origin");
  if (!isHealthcareMediaLabEnabled(host) || !origin) return false;

  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") return false;

  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" && origin === url.origin && url.host === host
    );
  } catch {
    return false;
  }
}
