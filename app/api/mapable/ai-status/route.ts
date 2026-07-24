import { NextResponse } from "next/server";

import {
  getInterpreterDisplayName,
  isGptOssDisplayActive,
  isSearchInterpreterConfigured,
} from "@/lib/config/search-interpreter";

/**
 * Public-safe AI status for UI labels. No secrets, base URLs, or keys.
 */
export async function GET() {
  const displayName = getInterpreterDisplayName();
  return NextResponse.json({
    configured: isSearchInterpreterConfigured(),
    displayName,
    gptOssActive: isGptOssDisplayActive(),
  });
}
