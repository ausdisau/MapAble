import type { Express } from "express";
import { storage } from "../storage";
import { insertJobSchema, insertTransportRequestSchema, insertMessageSchema } from "@shared/schema";
import { getWorkerIdForUser, requireAuth } from "./shared";

export function registerCatalogueRoutes(app: Express) {
  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    const parsed = insertJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const job = await storage.createJob(parsed.data);
    res.status(201).json(job);
  });

  app.get("/api/transport", async (_req, res) => {
    const requests = await storage.getTransportRequests();
    res.json(requests);
  });

  app.post("/api/transport", async (req, res) => {
    const parsed = insertTransportRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const request = await storage.createTransportRequest(parsed.data);
    res.status(201).json(request);
  });

  app.get("/api/messages", async (_req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const message = await storage.createMessage(parsed.data);
    res.status(201).json(message);
  });

  app.patch("/api/workers/:id/photo", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (!userWorkerId || userWorkerId !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own photo" });
    }
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ message: "photo path required" });
    const worker = await storage.updateWorkerPhoto(req.params.id, photo);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  });

  app.patch("/api/users/:id/avatar", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    if (userId !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own avatar" });
    }
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: "avatar path required" });
    const user = await storage.updateUserAvatar(req.params.id, avatar);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/widget-config", (_req, res) => {
    res.json({
      enabled: true,
      tabs: ["chat", "actions", "history"],
      defaultTab: "chat",
      featureFlags: {
        voiceEnabled: true,
        nlpEnabled: true,
        matchingEnabled: false,
        contractsEnabled: false,
        attestationsEnabled: false,
      },
      endpoints: {
        nlp: "/api/widget/nlp",
        voice: "/api/widget/voice",
        matching: "/api/widget/matching",
        contracts: "/api/widget/contracts",
        attestations: "/api/widget/attestations",
        chat: "/api/chat/send",
        sessions: "/api/chat/sessions",
        widgetConfig: "/api/widget-config",
      },
      launcherLabel: "Open MapAble assistant",
      panelTitle: "MapAble Assistant",
      panelSubtitle: "Chat, actions, and history",
    });
  });
}
