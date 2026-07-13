import { randomUUID } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "../config";
import { buildSessionConsent } from "../consent/session-consent";
import {
  executeIntelligenceReadTool,
  Intelligence