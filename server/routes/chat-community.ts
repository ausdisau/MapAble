import type { Express } from "express";
import { storage } from "../storage";
import { processInbound, webPlatformAdapter, createChatSession, getUserSessions, getSessionMessages, deleteChatSession } from "../chat-engine";
import {
  getGuardrailAuditLogs,
  getSafeguardingQueue,
  updateSafeguardingItem,
  SAFEGUARDING_ITEM_KINDS,
  SAFEGUARDING_QUEUE_STATUSES,
  type SafeguardingItemKind,
} from "../chat-guardrails";
import { requireAuth } from "./shared";

export function registerChatCommunityRoutes(app: Express) {
  app.get("/api/access-profile", requireAuth, async (req, res) => {
    const profile = await storage.getAccessProfile(req.session.userId!);
    res.json(profile || null);
  });

  app.put("/api/access-profile", requireAuth, async (req, res) => {
    const profile = await storage.upsertAccessProfile(req.session.userId!, req.body);
    res.json(profile);
  });

  app.post("/api/chat/sessions", requireAuth, async (req, res) => {
    const session = await createChatSession(req.session.userId!);
    res.status(201).json(session);
  });

  app.get("/api/chat/sessions", requireAuth, async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    res.json(sessions);
  });

  app.get("/api/chat/sessions/:id/messages", requireAuth, async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    const msgs = await getSessionMessages(req.params.id);
    res.json(msgs);
  });

  app.delete("/api/chat/sessions/:id", requireAuth, async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    await deleteChatSession(req.params.id);
    res.status(204).send();
  });

  app.post("/api/chat/send", requireAuth, async (req, res) => {
    try {
      const { sessionId, message, clientContext } = req.body;
      if (!sessionId || !message) return res.status(400).json({ message: "sessionId and message required" });
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((s) => s.id === sessionId);
      if (!owns) return res.status(403).json({ message: "Access denied" });
      const response = await processInbound(webPlatformAdapter, {
        sessionId,
        userId: req.session.userId!,
        message,
        clientContext,
      });
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/admin/chat/guardrails/audit", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const limit = Math.min(Number(req.query.limit || 100), 250);
      const includeRaw = req.query.raw === "true";
      const logs = await getGuardrailAuditLogs(limit, includeRaw);
      res.json(logs);
    } catch (error) {
      console.error("Guardrail audit error:", error);
      res.status(500).json({ message: "Failed to fetch guardrail audit logs" });
    }
  });

  app.get("/api/admin/chat/handoffs", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const handoffs = await storage.getChatHandoffs(status);
      res.json(handoffs);
    } catch (error) {
      console.error("Handoff list error:", error);
      res.status(500).json({ message: "Failed to fetch handoffs" });
    }
  });

  app.patch("/api/admin/chat/handoffs/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { status, resolutionNotes } = req.body || {};
      const allowed = ["requested", "assigned", "resolved"];
      if (status && !allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateChatHandoffStatus(String(req.params.id), {
        status,
        resolutionNotes,
        assignedTo: status === "assigned" || status === "resolved" ? user.id : undefined,
      });
      if (!updated) return res.status(404).json({ message: "Handoff not found" });
      res.json(updated);
    } catch (error) {
      console.error("Handoff update error:", error);
      res.status(500).json({ message: "Failed to update handoff" });
    }
  });

  app.get("/api/admin/chat/safeguarding", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== "admin" && user.role !== "provider")) {
        return res.status(403).json({ message: "Access denied" });
      }
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const items = await getSafeguardingQueue(status);
      res.json(items);
    } catch (error) {
      console.error("Safeguarding queue error:", error);
      res.status(500).json({ message: "Failed to fetch safeguarding queue" });
    }
  });

  app.patch("/api/admin/chat/safeguarding/:kind/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== "admin" && user.role !== "provider")) {
        return res.status(403).json({ message: "Access denied" });
      }
      const kind = req.params.kind as SafeguardingItemKind;
      if (!SAFEGUARDING_ITEM_KINDS.includes(kind)) {
        return res.status(400).json({ message: "Invalid item kind" });
      }
      const { status, reviewNotes } = req.body || {};
      if (status !== undefined && !SAFEGUARDING_QUEUE_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (reviewNotes !== undefined && reviewNotes !== null && typeof reviewNotes !== "string") {
        return res.status(400).json({ message: "Invalid review notes" });
      }
      const assignedTo = status === "in_review" || status === "closed" ? user.id : undefined;
      const updated = await updateSafeguardingItem(kind, String(req.params.id), {
        status,
        reviewNotes,
        assignedTo,
      });
      if (!updated) return res.status(404).json({ message: "Safeguarding item not found" });
      res.json(updated);
    } catch (error) {
      console.error("Safeguarding update error:", error);
      res.status(500).json({ message: "Failed to update safeguarding item" });
    }
  });

  app.get("/api/community-reports", async (_req, res) => {
    const reports = await storage.getCommunityReports();
    res.json(reports);
  });

  app.post("/api/community-reports", async (req, res) => {
    const { locationRef, barrierType, severity, description } = req.body;
    if (!locationRef || !barrierType || !severity) {
      return res.status(400).json({ message: "locationRef, barrierType, and severity are required" });
    }
    const report = await storage.createCommunityReport({
      reporterUserId: req.session.userId!,
      locationRef,
      barrierType,
      severity,
      description: description || null,
    });
    res.status(201).json(report);
  });

  app.patch("/api/community-reports/:id", requireAuth, async (req, res) => {
    const { locationRef, barrierType, severity, description } = req.body || {};
    const data: Record<string, unknown> = {};
    if (locationRef !== undefined) data.locationRef = locationRef;
    if (barrierType !== undefined) data.barrierType = barrierType;
    if (severity !== undefined) data.severity = severity;
    if (description !== undefined) data.description = description || null;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    const updated = await storage.updateCommunityReport(String(req.params.id), req.session.userId!, data);
    if (!updated) return res.status(404).json({ message: "Report not found or not yours" });
    res.json(updated);
  });
}
