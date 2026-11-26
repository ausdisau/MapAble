const loopbackHost = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/;

export function isLocalHealthcarePreview(host: string | null) {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.MAPABLE_HEALTHCARE_PREVIEW_ENABLED === "true" &&
    host !== null &&
    loopbackHost.test(host)
  );
}

export function isLocalHealthcarePreviewRequest(headers: Headers) {
  const host = headers.get("host");
  const origin = headers.get("origin");
  if (!isLocalHealthcarePreview(host) || !origin) return false;

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
