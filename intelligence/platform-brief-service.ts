import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "./config";
import type {
  PlatformBrief,
  PlatformBriefRequest,
  PlatformModuleBrief,
} from "./core-types";
import { buildSessionConsent } from "./consent/session-consent";
import {
  executeIntelligenceReadTool,
  IntelligenceToolAccessError,
  type