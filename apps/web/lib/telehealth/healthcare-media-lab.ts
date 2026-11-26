import {
  isLocalHealthcarePreview,
  isLocalHealthcarePreviewRequest,
} from "./healthcare-local-preview";

export const labRoomCode = /^[0-9a-f]{32}$/;

export function isHealthcareMediaLabEnabled(host: string | null) {
  return (
    process.env.MAPABLE_HEALTHCARE_MEDIA_LAB_ENABLED === "true" &&
    isLocalHealthcarePreview(host)
  );
}

export function isHealthcareMediaLabRequest(headers: Headers) {
  return (
    process.env.MAPABLE_HEALTHCARE_MEDIA_LAB_ENABLED === "true" &&
    isLocalHealthcarePreviewRequest(headers)
  );
}
