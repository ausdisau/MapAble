import type { NextRequest } from "next/server";

import {
  CSP_ENFORCE_HEADER,
  CSP_NONCE_HEADER,
} from "@/lib/security/csp-preview-enforce";
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from "@/lib/security/request-correlation";

/**
 * Forward the resolved correlation ID (never the raw untrusted header) plus
 * CSP nonce/policy so downstream handlers and Next.js share one safe ID.
 */
export function buildForwardRequestHeaders(
  request: NextRequest,
  nonce: string,
  enforcePolicy: string | null,
  correlationId: string,
): Headers {
  const requestHeaders = new Headers(request.headers);
  // Internal only — not a public client header contract.
  requestHeaders.set(CSP_NONCE_HEADER, nonce);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);
  requestHeaders.set(REQUEST_ID_HEADER, correlationId);
  if (enforcePolicy) {
    // Next.js reads CSP from the *request* to nonce framework/inline scripts.
    requestHeaders.set(CSP_ENFORCE_HEADER, enforcePolicy);
  }
  return requestHeaders;
}
